import { skills, type Call, type Retry, type ScoredAnswer, type Skill } from "../store/types.ts";

// Scores worked out from stored calls, so nothing extra is saved (PRD.md, Scorecard: Gamification).

export const skillNames: Record<Skill, string> = {
  clarity: "Clarity",
  structure: "Structure",
  evidence: "Evidence",
  relevance: "Relevance",
  delivery: "Delivery",
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** The call's score per skill: the rounded average across its answers. */
export function callSkillScores(call: Pick<Call, "scorecard">): Record<Skill, number> | null {
  const answers = call.scorecard?.answers ?? [];
  if (answers.length === 0) return null;
  return Object.fromEntries(
    skills.map((skill) => [skill, Math.round(average(answers.map((answer) => answer.scores[skill])))]),
  ) as Record<Skill, number>;
}

/** The lowest scoring skill. Ties go to the order the rubric lists them in. */
export function weakestSkill(scores: Record<Skill, number>) {
  return skills.reduce((low, skill) => (scores[skill] < scores[low] ? skill : low), skills[0]);
}

export const answerTotal = (answer: Pick<ScoredAnswer, "scores">) =>
  skills.reduce((sum, skill) => sum + answer.scores[skill], 0);

/** Score change per skill from the original answer to a retry, and the total. */
export function retryChange(original: ScoredAnswer, retry: Pick<Retry, "answer">) {
  const perSkill = Object.fromEntries(
    skills.map((skill) => [skill, retry.answer.scores[skill] - original.scores[skill]]),
  ) as Record<Skill, number>;
  return { perSkill, total: answerTotal(retry.answer) - answerTotal(original) };
}

/** The best retry for a question so far, if any. */
export function bestRetry(call: Pick<Call, "retries">, questionIndex: number) {
  return (call.retries ?? [])
    .filter((retry) => retry.questionIndex === questionIndex)
    .reduce<Retry | null>((best, retry) => (!best || answerTotal(retry.answer) > answerTotal(best.answer) ? retry : best), null);
}

/** The biggest single-skill gain across this call's retries, for the "+1 Structure" pill. */
export function bestGain(call: Pick<Call, "scorecard" | "retries">) {
  let gain: { skill: Skill; amount: number } | null = null;
  for (const retry of call.retries ?? []) {
    const original = call.scorecard?.answers.find((answer) => answer.questionIndex === retry.questionIndex);
    if (!original) continue;
    const { perSkill } = retryChange(original, retry);
    for (const skill of skills) {
      if (perSkill[skill] > 0 && (!gain || perSkill[skill] > gain.amount)) gain = { skill, amount: perSkill[skill] };
    }
  }
  return gain;
}

/** Best call score per skill across completed calls. */
export function personalBests(calls: Pick<Call, "status" | "scorecard">[]) {
  const best: Partial<Record<Skill, number>> = {};
  for (const call of calls) {
    if (call.status !== "completed") continue;
    const scores = callSkillScores(call);
    if (!scores) continue;
    for (const skill of skills) best[skill] = Math.max(best[skill] ?? 0, scores[skill]);
  }
  return best;
}
