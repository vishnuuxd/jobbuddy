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
