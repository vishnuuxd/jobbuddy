import { midSentence } from "../call/opening.ts";
import type { Call } from "../store/types";

// Plain-words labels for Home, History and Profile. Pure, so they're unit tested.

export function greeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function callTitle(call: Pick<Call, "setup">) {
  if (!call.setup?.role) return "Call with Meera";
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

export type Pill = { tone: "mint" | "cream" | "pink" | "grey"; label: string } | null;

/** Incomplete calls get a grey pill. Completed and failed calls get theirs with the scorecard. */
export function callPill(call: Pick<Call, "status">): Pill {
  return call.status === "incomplete" ? { tone: "grey", label: "Incomplete" } : null;
}
