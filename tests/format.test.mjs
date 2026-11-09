import assert from "node:assert/strict";
import { test } from "node:test";
import { callMeta, callPill, callTitle, completion, dayLabel, greeting, streakDays } from "../lib/home/format.ts";

const now = new Date(2026, 10, 8, 20, 0); // Sun 8 Nov 2026, 8 pm
const daysAgo = (n, hour = 10) => new Date(2026, 10, 8 - n, hour).toISOString();

test("greeting follows the time of day", () => {
  assert.equal(greeting(new Date(2026, 10, 8, 8)), "Good morning");
  assert.equal(greeting(new Date(2026, 10, 8, 14)), "Good afternoon");
  assert.equal(greeting(now), "Good evening");
});

test("call titles read like the role", () => {
  assert.equal(callTitle({ setup: { role: "Product designer", seniority: "Senior" } }), "Senior product designer");
  assert.equal(callTitle({ setup: { role: "UX researcher", seniority: "lead" } }), "Lead UX researcher");
  assert.equal(callTitle({}), "Call with Meera");
});

test("day labels", () => {
  assert.equal(dayLabel(new Date(daysAgo(0)), now), "Today");
  assert.equal(dayLabel(new Date(daysAgo(1)), now), "Yesterday");
  assert.equal(dayLabel(new Date(daysAgo(5)), now), "Tue");
  assert.equal(dayLabel(new Date(daysAgo(10)), now), "29 Oct");
});

test("meta line has the length when the call ended", () => {
  const startedAt = daysAgo(1);
  const endedAt = new Date(new Date(startedAt).getTime() + 9.6 * 60_000).toISOString();
  assert.equal(callMeta({ startedAt, endedAt }, now), "Yesterday · 10 min");
  assert.equal(callMeta({ startedAt }, now), "Yesterday");
});

test("completion counts completed calls only", () => {
  assert.equal(completion([{ status: "completed" }, { status: "incomplete" }, { status: "scoring_failed" }]), "1 of 3 interviews completed");
  assert.equal(completion([]), "0 of 0 interviews completed");
  assert.equal(completion([{ status: "completed" }]), "1 of 1 interview completed");
});

test("streak counts days in a row with a completed call", () => {
  const done = (n) => ({ status: "completed", startedAt: daysAgo(n) });
  assert.equal(streakDays([], now), 0);
  assert.equal(streakDays([done(0), done(1), done(2)], now), 3);
  assert.equal(streakDays([done(1), done(2)], now), 2); // Today isn't over yet.
  assert.equal(streakDays([done(0), done(2)], now), 1); // A missed day resets it.
  assert.equal(streakDays([{ status: "incomplete", startedAt: daysAgo(0) }], now), 0);
});

test("incomplete calls get a grey pill", () => {
  assert.deepEqual(callPill({ status: "incomplete" }), { tone: "grey", label: "Incomplete" });
  assert.equal(callPill({ status: "completed" }), null);
});

test("History rows add the time of day", async () => {
  const { callMetaWithTime } = await import("../lib/home/format.ts");
  const startedAt = new Date(2026, 10, 8, 16, 12).toISOString();
  const endedAt = new Date(2026, 10, 8, 16, 22).toISOString();
  assert.equal(callMetaWithTime({ startedAt, endedAt }, now), "Today, 4:12 pm · 10 min");
});

test("best streak, the last 7 days and the note under the streak", async () => {
  const { bestStreak, lastSevenDays, streakNote } = await import("../lib/home/format.ts");
  const done = (n) => ({ status: "completed", startedAt: daysAgo(n) });
  const calls = [done(1), done(2), done(3), done(6), done(7), done(8), done(9), done(10), { status: "incomplete", startedAt: daysAgo(0) }];
  assert.equal(bestStreak(calls), 5);
  assert.equal(bestStreak([]), 0);
  const week = lastSevenDays(calls, now);
  assert.deepEqual(week.map((day) => day.label), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"]);
  assert.deepEqual(week.map((day) => day.done), [true, false, false, true, true, true, false]);
  assert.equal(streakNote(3, 5, false), "Practise today to make it 4. Your best is 5 days.");
  assert.equal(streakNote(4, 4, true), "You practised today. Come back tomorrow to make it 5.");
  assert.equal(streakNote(0, 2, false), "One completed call today starts a streak. Your best is 2 days.");
});
