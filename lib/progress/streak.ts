import { streakDays } from "../home/format.ts";
import type { Call } from "../store/types.ts";

export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** The streak screen shows once, on the day a completed call starts a new streak. */
export function shouldShowStreak(calls: Pick<Call, "status" | "startedAt">[], shownOn: string | undefined, now: Date) {
  return streakDays(calls, now) === 1 && shownOn !== dayKey(now) &&
    calls.some((call) => call.status === "completed" && dayKey(new Date(call.startedAt)) === dayKey(now));
}

/** Today and the next four days, with real weekday names. */
export function streakWeek(now: Date) {
  return Array.from({ length: 5 }, (_, offset) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return { key: dayKey(day), label: day.toLocaleDateString("en-GB", { weekday: "short" }), today: offset === 0 };
  });
}
