"use client";

import { getCall, saveCall } from "../store/db";
import type { Call, Retry, TranscriptLine } from "../store/types";

/** Builds the scorecard for a saved call, and saves the result: completed, or scoring_failed with the transcript kept. */
export async function buildScorecard(callId: string): Promise<Call | null> {
  const call = await getCall(callId);
  if (!call) return null;
  try {
    const res = await fetch("/api/scorecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "call", call }),
    });
    if (!res.ok) throw new Error(`Scorecard route returned ${res.status}`);
    const { scorecard } = (await res.json()) as Pick<Call, "scorecard">;
    const done: Call = { ...call, scorecard, status: "completed" };
    await saveCall(done);
    return done;
  } catch {
    const failed: Call = { ...call, status: "scoring_failed" };
    await saveCall(failed);
    return failed;
  }
}

/** Scores a retried answer and saves it under the original call. Returns null if scoring failed. */
export async function scoreRetry(callId: string, questionIndex: number, question: string, transcript: TranscriptLine[]) {
  const call = await getCall(callId);
  if (!call) return null;
  try {
    const res = await fetch("/api/scorecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "retry", call, questionIndex, question, transcript }),
    });
    if (!res.ok) throw new Error(`Scorecard route returned ${res.status}`);
    const { answer } = (await res.json()) as { answer: Retry["answer"] };
    const retry: Retry = { questionIndex, at: new Date().toISOString(), answer, transcript };
    // Re-read, in case the call changed while the request ran.
    const latest = (await getCall(callId)) ?? call;
    await saveCall({ ...latest, retries: [...latest.retries, retry] });
    return retry;
  } catch {
    return null;
  }
}
