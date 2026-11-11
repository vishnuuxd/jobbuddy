import assert from "node:assert/strict";
import { test } from "node:test";
import { closedWithoutDone, herTurnText } from "../lib/call/closeNet.ts";
import { callConfig } from "../lib/call/config.ts";

const closing = "Okay, that's everything I wanted to ask. Your scorecard's ready when you are.";
const state = (over = {}) => ({
  phase: "interview", question: 2, questionCount: 2, speaking: false, retry: false,
  transcript: [{ speaker: "agent", text: "Tell me about a disagreement." }, { speaker: "user", text: "Once, a stakeholder..." }, { speaker: "agent", text: closing }],
  ...over,
});
const wait = callConfig.closingLineWaitMs;
// Her closing line arrives at 10 s, its audio stops at 14 s.
const voice = (now) => ({ lineAt: 10_000, stoppedAt: 14_000, now });

test("the wait is 3 s", () => assert.equal(wait, 3_000));

test("she says her closing line and never calls done: the app closes 3 s after her audio stops", () => {
  assert.equal(closedWithoutDone(state(), voice(16_900), wait), false);
  assert.equal(closedWithoutDone(state(), voice(17_000), wait), true);
});

test("she calls done within 3 s: the normal close runs and the net never fires", () => {
  assert.equal(closedWithoutDone(state({ phase: "done" }), voice(17_000), wait), false);
});

test("it only fires on the last question, on a closing line, once she's quiet", () => {
  assert.equal(closedWithoutDone(state({ question: 1 }), voice(20_000), wait), false, "not the last question");
  assert.equal(closedWithoutDone(state({ transcript: [{ speaker: "user", text: "x" }, { speaker: "agent", text: "Tell me more." }] }), voice(20_000), wait), false, "not a closing line");
  assert.equal(closedWithoutDone(state({ speaking: true }), voice(20_000), wait), false, "still speaking");
  assert.equal(closedWithoutDone(state(), { lineAt: 15_000, stoppedAt: 14_000, now: 20_000 }, wait), false, "closing line's audio not played yet");
  assert.equal(closedWithoutDone(state({ retry: true }), voice(20_000), wait), false, "retry calls close themselves");
});

test("her turn is everything since my last line", () => {
  assert.equal(herTurnText([{ speaker: "agent", text: "a" }, { speaker: "user", text: "b" }, { speaker: "agent", text: "c" }, { speaker: "agent", text: "d" }]), "c d");
});
