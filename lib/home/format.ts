import { midSentence } from "../call/opening.ts";
import { callName } from "./callName.ts";
import { bestGain, callSkillScores, skillNames, weakestSkill } from "../progress/score.ts";
import type { Call } from "../store/types";

// Plain-words labels for Home, History and Profile. Pure, so they're unit tested.

export function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function callTitle(call: Pick<Call, "setup" | "number">) {
  if (!call.setup?.role) return "Call with Meera";
  if (call.number) return callName(call.setup, call.number);
  const seniority = call.setup.seniority?.trim();
  const role = midSentence(call.setup.role);
  const title = seniority ? `${seniority} ${role}` : role;
  return title.charAt(0).toUpperCase() + title.slice(1);
}

const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function dayLabel(when: Date, now: Date) {
  const days = Math.round((dayStart(now) - dayStart(when)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return when.toLocaleDateString("en-GB", { weekday: "short" });
  return when.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function callMeta(call: Pick<Call, "startedAt" | "endedAt">, now: Date) {
  const started = new Date(call.startedAt);
  const parts = [dayLabel(started, now)];
  if (call.endedAt) {
    const minutes = Math.max(1, Math.round((new Date(call.endedAt).getTime() - started.getTime()) / 60_000));
    parts.push(`${minutes} min`);
  }
  return parts.join(" · ");
}

/** "Today, 4:12 pm · 10 min": History rows show the time of day too. */
export function callMetaWithTime(call: Pick<Call, "startedAt" | "endedAt">, now: Date) {
  const [day, ...rest] = callMeta(call, now).split(" · ");
  const time = new Date(call.startedAt)
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s/g, " ")
    .toLowerCase();
  return [`${day}, ${time}`, ...rest].join(" · ");
}

export function completion(calls: Pick<Call, "status">[]) {
  const done = calls.filter((call) => call.status === "completed").length;
  return `${done} of ${calls.length} ${calls.length === 1 ? "interview" : "interviews"} completed`;
}

/** Days in a row, up to today or yesterday, with at least one completed call. A missed day resets it. */
export function streakDays(calls: Pick<Call, "status" | "startedAt">[], now: Date) {
  const days = new Set(
    calls.filter((call) => call.status === "completed").map((call) => dayStart(new Date(call.startedAt))),
  );
  let day = dayStart(now);
  if (!days.has(day)) day = dayStart(new Date(day - 43_200_000)); // Today doesn't break it until it's over.
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = dayStart(new Date(day - 43_200_000));
  }
  return streak;
}

export type Pill = { tone: "lime" | "grey" | "pink" | "plum"; label: string } | null;

/** "+1 Structure" after a retry that improved, otherwise the weakest skill and its score. */
export function callPill(call: Pick<Call, "status" | "scorecard" | "retries">): Pill {
  if (call.status === "incomplete") return { tone: "grey", label: "Incomplete" };
  if (call.status === "scoring_failed") return { tone: "pink", label: "No scorecard yet" };
  const gain = bestGain(call);
  if (gain) return { tone: "lime", label: `+${gain.amount} ${skillNames[gain.skill]}` };
  const scores = callSkillScores(call);
  if (!scores) return null;
  const weakest = weakestSkill(scores);
  return { tone: "grey", label: `${skillNames[weakest]} ${scores[weakest]}` };
}

const completedDays = (calls: Pick<Call, "status" | "startedAt">[]) =>
  new Set(calls.filter((call) => call.status === "completed").map((call) => dayStart(new Date(call.startedAt))));

/** The longest run of days in a row with a completed call, ever. */
export function bestStreak(calls: Pick<Call, "status" | "startedAt">[]) {
  const days = [...completedDays(calls)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of days) {
    // Days are local midnights: one day apart is 20 to 28 hours, through clock changes.
    run = previous !== null && day - previous < 30 * 3_600_000 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** The last 7 days, oldest first, ending today, and whether each had a completed call. */
export function lastSevenDays(calls: Pick<Call, "status" | "startedAt">[], now: Date) {
  const days = completedDays(calls);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    const today = index === 6;
    return {
      key: date.toISOString(),
      label: today ? "Today" : date.toLocaleDateString("en-GB", { weekday: "short" }),
      done: days.has(dayStart(date)),
      today,
    };
  });
}

/** The line under the History streak. */
export function streakNote(streak: number, best: number, practisedToday: boolean) {
  const bestPart = best > streak ? ` Your best is ${best} days.` : "";
  if (streak === 0) return `One completed call today starts a streak.${bestPart}`;
  if (practisedToday) return `You practised today. Come back tomorrow to make it ${streak + 1}.${bestPart}`;
  return `Practise today to make it ${streak + 1}.${bestPart}`;
}
