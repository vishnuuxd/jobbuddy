import { answerTotal } from "./score.ts";
import type { Call } from "../store/types.ts";

// Badges from PRD.md, Scorecard: Gamification. Worked out from the call, never stored.

export const badgeList = [
  { id: "landed", name: "Landed the result", tone: "white" },
  { id: "noRamble", name: "No ramble", tone: "sun" },
  { id: "fillerFree", name: "Filler free", tone: "mint" },
  { id: "comeback", name: "Comeback", tone: "pink" },
] as const;
export type BadgeId = (typeof badgeList)[number]["id"];

type Thresholds = { noRambleMaxSeconds: number; fillerFreeMaxPerAnswer: number };

/** The badges one completed call earned. */
export function callBadges(call: Pick<Call, "status" | "scorecard" | "metrics" | "flags" | "retries">, limits: Thresholds) {
  const earned: BadgeId[] = [];
  const answers = call.scorecard?.answers ?? [];
  if (call.status !== "completed" || answers.length === 0) return earned;

  const noResultFlags = call.flags.some((flag) => flag.type === "no_result");
  if (!noResultFlags && answers.every((answer) => answer.flagged?.type !== "no_result")) earned.push("landed");

  const metrics = call.metrics.filter((metric) => metric.questionIndex > 0);
  const rambled = call.flags.some((flag) => flag.type === "rambling");
  if (metrics.length > 0 && !rambled && metrics.every((metric) => metric.seconds <= limits.noRambleMaxSeconds)) {
    earned.push("noRamble");
  }
  if (metrics.length > 0 && metrics.every((metric) => metric.fillers < limits.fillerFreeMaxPerAnswer)) {
    earned.push("fillerFree");
  }

  const comeback = (call.retries ?? []).some((retry) => {
    const original = answers.find((answer) => answer.questionIndex === retry.questionIndex);
    return original && answerTotal(retry.answer) > answerTotal(original);
  });
  if (comeback) earned.push("comeback");
  return earned;
}

/** How many times each badge was earned, across calls. */
export function badgeCounts(calls: Parameters<typeof callBadges>[0][], limits: Thresholds) {
  const counts = Object.fromEntries(badgeList.map((badge) => [badge.id, 0])) as Record<BadgeId, number>;
  for (const call of calls) for (const id of callBadges(call, limits)) counts[id] += 1;
  return counts;
}
