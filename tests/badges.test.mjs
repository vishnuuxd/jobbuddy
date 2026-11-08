import assert from "node:assert/strict";
import { test } from "node:test";
import { liveConfig } from "../lib/live/config.ts";
import { badgeCounts, callBadges } from "../lib/progress/badges.ts";
import { answer, scoredCall, scores } from "./fixtures.mjs";

const limits = liveConfig.badges;
const metric = (questionIndex, seconds, fillers) => ({ questionIndex, seconds, fillers, words: 100, wpm: 130, hedges: 0 });

test("a clean call earns landed, no ramble and filler free", () => {
  const call = scoredCall({ metrics: [metric(1, 60, 1), metric(2, 100, 2)] });
  assert.deepEqual(callBadges(call, limits), ["landed", "noRamble", "fillerFree"]);
});

test("a no_result flag, a long answer and three fillers each lose their badge", () => {
  const call = scoredCall({
    flags: [{ type: "no_result", quote: "x", atSeconds: 1, source: "agent" }],
    metrics: [metric(1, 130, 3)],
  });
  assert.deepEqual(callBadges(call, limits), []);
});

test("rambling flags lose No ramble even under two minutes", () => {
  const call = scoredCall({ flags: [{ type: "rambling", quote: "x", atSeconds: 1, source: "client" }], metrics: [metric(1, 60, 0)] });
  assert.ok(!callBadges(call, limits).includes("noRamble"));
});

test("a retry that scores higher earns Comeback", () => {
  const call = scoredCall({ metrics: [metric(1, 60, 0)], retries: [{ questionIndex: 2, at: "a", transcript: [], answer: answer(2, scores(5, 5, 5, 5, 5)) }] });
  assert.ok(callBadges(call, limits).includes("comeback"));
});

test("incomplete calls earn nothing, and counts add up across calls", () => {
  assert.deepEqual(callBadges(scoredCall({ status: "incomplete" }), limits), []);
  const clean = scoredCall({ metrics: [metric(1, 60, 1)] });
  assert.equal(badgeCounts([clean, clean], limits).noRamble, 2);
});

test("the streak screen shows once, on the day a new streak starts", async () => {
  const { shouldShowStreak, streakWeek, dayKey } = await import("../lib/progress/streak.ts");
  const now = new Date(2026, 10, 8, 20);
  const today = { status: "completed", startedAt: new Date(2026, 10, 8, 10).toISOString() };
  const yesterday = { status: "completed", startedAt: new Date(2026, 10, 7, 10).toISOString() };
  assert.equal(shouldShowStreak([today], undefined, now), true);
  assert.equal(shouldShowStreak([today], dayKey(now), now), false); // Already shown today.
  assert.equal(shouldShowStreak([today, yesterday], undefined, now), false); // Day 2, not a start.
  assert.equal(shouldShowStreak([{ ...today, status: "incomplete" }], undefined, now), false);
  assert.deepEqual(streakWeek(now).map((day) => day.label), ["Sun", "Mon", "Tue", "Wed", "Thu"]);
});
