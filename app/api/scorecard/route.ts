import { NextResponse } from "next/server";
import { retryPrompt, scorecardPrompt } from "@/lib/scorecard/prompt";
import { retrySchema, scorecardSchema, validateAnswer, validateScorecard } from "@/lib/scorecard/schema";
import type { Call, TranscriptLine } from "@/lib/store/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The current Flash model on this key, checked on 8 Nov 2026. GEMINI_MODEL overrides it.
const defaultModel = "gemini-3.8-flash";
// When the main model is busy or rate limited, one try on each of these, in order.
const fallbackModels = ["gemini-flash-latest", "gemini-3.5-flash"];

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
    if (index > 0 && Date.now() - started > 35_000) break; // Leave time for one more full answer.
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
      signal: AbortSignal.timeout(Math.max(5_000, 55_000 - (Date.now() - started))),
    });
    if (res.ok) {
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      return JSON.parse(text) as unknown;
    }
    const detail = (await res.text()).slice(0, 300);
    if (!retryable.has(res.status)) throw new Error(`Gemini returned ${res.status}: ${detail}`);
    if (attempt >= maxAttempts || Date.now() - started > 35_000) throw new BusyError(`${model} returned ${res.status}: ${detail}`);
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
