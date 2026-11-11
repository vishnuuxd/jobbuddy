import type { TranscriptLine } from "../store/types.ts";

// Safety net for the close (PRD.md, Call behavior: Close). On a phone test on 11 Nov she said
// her closing line ("Your scorecard's ready when you are.") and never called setPhase("done"),
// so the call stayed open. If she's on the last main question, her turn mentions the scorecard,
// and done hasn't come within closingLineWaitMs of her audio stopping, the app closes the call.

type State = {
  phase: string;
  question: number;
  questionCount: number | null;
  speaking: boolean;
  retry: boolean;
  transcript: Pick<TranscriptLine, "speaker" | "text">[];
};

/** Her current turn: everything she has said since my last line. */
export function herTurnText(transcript: State["transcript"]) {
  let lastMine = -1;
  transcript.forEach((line, i) => {
    if (line.speaker === "user") lastMine = i;
  });
  return transcript.slice(lastMine + 1).filter((l) => l.speaker === "agent").map((l) => l.text).join(" ");
}

export const isClosingLine = (text: string) => /\bscorecard/i.test(text);

/** True when the app should close the call itself. */
export function closedWithoutDone(state: State, voice: { lineAt: number; stoppedAt: number; now: number }, waitMs: number) {
  if (state.retry || state.phase !== "interview" || state.speaking) return false;
  if (!state.questionCount || state.question < state.questionCount) return false;
  if (!isClosingLine(herTurnText(state.transcript))) return false;
  // Her closing line has been heard: its audio stopped after its text arrived.
  if (!voice.stoppedAt || voice.stoppedAt < voice.lineAt) return false;
  return voice.now - voice.stoppedAt >= waitMs;
}
