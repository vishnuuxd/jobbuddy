import type { Phase } from "./session.ts";

// The words on the call screen for each moment (screens 1.3 to 1.6, 2.1). Pure, so it's tested.

export type CallStage = "connecting" | "live" | "writing";

export type CopyInput = {
  stage: CallStage;
  phase: Phase;
  speaking: boolean;
  writingNote: boolean; // Meera is holding the writing mood after a flag
  watching: boolean; // checkWatch fired a moment ago
  retry: { questionIndex: number; hint?: string } | null;
  question: number;
  total: number | null;
  answered: number;
  lastAgentLine?: string;
  openingLine?: string;
  retryQuestion?: string;
};

export function questionLabel(question: number, total: number | null) {
  if (question <= 0) return "Getting started";
  return total ? `Question ${question} of ${total}` : `Question ${question}`;
}

export function callCopy(input: CopyInput) {
  const label = questionLabel(input.question, input.total);

  if (input.stage === "connecting") {
    return { title: "Calling Meera", sub: "Connecting…", pill: "Connecting", cardLabel: null, cardText: null };
  }
  if (input.stage === "writing") {
    const answers = `${input.answered} ${input.answered === 1 ? "answer" : "answers"}`;
    return { title: input.retry ? "Scoring your new answer" : "Writing up your scorecard", sub: answers, pill: "Call ended", cardLabel: null, cardText: null };
  }
  if (input.retry) {
    return {
      title: input.speaking ? "Meera's asking again" : "Take two",
      sub: input.retry.hint ? `Remember: ${input.retry.hint}` : "Same question, one more go",
      pill: "Just this one",
      cardLabel: "Meera asks again",
      cardText: input.retryQuestion ?? input.lastAgentLine ?? null,
    };
  }
  if (input.phase === "opening" || input.phase === "idle") {
    return {
      title: "Meera's saying hi",
      sub: "Say you're ready when you are",
      pill: "Opening",
      cardLabel: "Meera says",
      cardText: input.lastAgentLine ?? input.openingLine ?? null,
    };
  }
  const card = { cardLabel: "Meera asked", cardText: input.lastAgentLine ?? null };
  if (input.phase === "done") return { title: "That's a wrap", sub: "Meera's finishing up", pill: label, ...card };
  if (input.watching) return { title: "Meera checks the time", sub: "Getting long · land the result", pill: label, ...card };
  if (input.writingNote) return { title: "Meera's making a note", sub: label, pill: label, ...card };
  if (input.speaking) return { title: "Meera's talking", sub: label, pill: label, ...card };
  return { title: "Meera's listening", sub: label, pill: label, ...card };
}
