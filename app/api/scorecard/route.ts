import { NextResponse } from "next/server";
import { retryPrompt, scorecardPrompt } from "@/lib/scorecard/prompt";
import { retrySchema, scorecardSchema, validateAnswer, validateScorecard } from "@/lib/scorecard/schema";
import type { Call, TranscriptLine } from "@/lib/store/types";

export const dynamic = "force-dynamic";
// Within the Hobby plan's 300 s limit (Fluid compute). The client gives up at 130 s (lib/scorecard/request.ts).
export const maxDuration = 120;

// The fastest model that works on this key, checked on 11 Nov 2026 with a 20 minute call:
// gemini-3.5-flash answered in 16 to 20 s. gemini-3.8-flash gave no answer in 180 s, then 503s.
// gemini-flash-latest gave 503s. GEMINI_MODEL overrides it.
const defaultModel = "gemini-3.5-flash";
// When the main model is busy, rate limited or slow, one try on each of these, in order.
const fallbackModels = ["gemini-3.8-flash", "gemini-flash-latest"];
// A model that hasn't answered by then counts as busy, so the next one gets a turn.
const perModelMs = 45_000;
const totalMs = 110_000;

type Body =
  | { kind: "call"; call: Call }
  | { kind: "retry"; call: Call; questionIndex: number; question: string; transcript: TranscriptLine[] };

const retryable = new Set([429, 500, 503]);

class BusyError extends Error {}

async function generate(prompt: string, schema: object) {
  const model = process.env.GEMINI_MODEL || defaultModel;
  const started = Date.now();
  const chain = [model, ...fallbackModels.filter((name) => name !== model)];
  let lastError: unknown;
  for (const [index, name] of chain.entries()) {
    if (index > 0 && Date.now() - started > totalMs - 15_000) break; // Leave time for one more answer.
    try {
      return await generateWith(name, prompt, schema, started, index === 0 ? 2 : 1);
    } catch (error) {
      if (!(error instanceof BusyError)) throw error;
      lastError = error;
      console.warn(`Scorecard: ${name} is busy, trying the next model`);
    }
  }
  throw lastError;
}

async function generateWith(model: string, prompt: string, schema: object, started: number, maxAttempts = 3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // Gemini is sometimes briefly busy (503). Try again twice, inside the route's time limit.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(Math.max(5_000, Math.min(perModelMs, totalMs - (Date.now() - started)))),
    }).catch((error: unknown) => {
      // Too slow counts as busy, so the next model gets a turn.
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new BusyError(`${model} took longer than ${perModelMs / 1000} s`);
      }
      throw error;
    });
    if (res.ok) {
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      return JSON.parse(text) as unknown;
    }
    const detail = (await res.text()).slice(0, 300);
    if (!retryable.has(res.status)) throw new Error(`Gemini returned ${res.status}: ${detail}`);
    if (attempt >= maxAttempts || Date.now() - started > totalMs - 20_000) throw new BusyError(`${model} returned ${res.status}: ${detail}`);
    await new Promise((resolve) => setTimeout(resolve, 1_500 * attempt));
  }
}

/** Builds a scorecard for a call, or scores one retried answer. The key stays on the server. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    if (body.kind === "retry") {
      const answer = validateAnswer(
        await generate(retryPrompt(body.call, body.questionIndex, body.question, body.transcript), retrySchema),
      );
      if (!answer) return NextResponse.json({ error: "The model's answer didn't fit the schema" }, { status: 502 });
      return NextResponse.json({ answer: { ...answer, questionIndex: body.questionIndex } });
    }
    const scorecard = validateScorecard(await generate(scorecardPrompt(body.call), scorecardSchema));
    if (!scorecard) return NextResponse.json({ error: "The model's scorecard didn't fit the schema" }, { status: 502 });
    return NextResponse.json({ scorecard });
  } catch (error) {
    console.error("Scorecard failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Scorecard failed" }, { status: 502 });
  }
}
