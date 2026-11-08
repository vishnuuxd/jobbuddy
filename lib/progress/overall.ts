import { answerTotal } from "./score.ts";
import { skills, type Call, type ScoredAnswer, type Scorecard } from "../store/types.ts";

// The overall score from PRD.md, Scorecard: Overall score. Worked out by the app, never by the model.

const roundOne = (value: number) => Math.round(value * 10) / 10;

/** The average of every skill score across every scored answer, to one decimal. */
export function overallScore(answers: Pick<ScoredAnswer, "scores">[]) {
  if (answers.length === 0) return null;
  const all = answers.flatMap((answer) => skills.map((skill) => answer.scores[skill]));
  return roundOne(all.reduce((sum, score) => sum + score, 0) / all.length);
}

export const scoreBands = [
  { from: 4.3, word: "Strong" },
  { from: 3.5, word: "Interview ready" },
  { from: 2.5, word: "Getting there" },
  { from: 0, word: "Not there yet" },
] as const;

/** The word for a score: under 2.5, 2.5 to 3.4, 3.5 to 4.2, 4.3 and up. */
export function scoreWord(score: number) {
  return scoreBands.find((band) => score >= band.from)!.word;
}

/** How much the score would rise with each answer's best retry. Retries never change the saved score itself. */
export function retryLift(call: Pick<Call, "scorecard" | "retries">) {
  const answers = call.scorecard?.answers ?? [];
  const before = overallScore(answers);
  if (before === null) return 0;
  const withRetries = answers.map((answer) => {
    const best = (call.retries ?? [])
      .filter((retry) => retry.questionIndex === answer.questionIndex)
      .reduce<ScoredAnswer>((top, retry) => (answerTotal(retry.answer) > answerTotal(top) ? retry.answer : top), answer);
    return best;
  });
  const lift = roundOne(overallScore(withRetries)! - before);
  return lift > 0 ? lift : 0;
}

/** The score shown for a call: only completed calls with a scorecard have one. */
export function callScore(call: Pick<Call, "status" | "scorecard" | "retries">) {
  if (call.status !== "completed" || !call.scorecard) return null;
  const score = overallScore(call.scorecard.answers);
  if (score === null) return null;
  return { score, word: scoreWord(score), lift: retryLift(call) };
}

export type { Scorecard };
