import assert from "node:assert/strict";
import { test } from "node:test";
import { readyToHangUp } from "../lib/call/close.ts";

const quiet = 1000;
const base = { done: true, speaking: false, lastLineAt: 10_000, voiceStoppedAt: 14_000, now: 15_000 };

test("hangs up 1 second after her closing line stops", () => {
  assert.equal(readyToHangUp({ ...base, now: 14_900 }, quiet), false);
  assert.equal(readyToHangUp(base, quiet), true);
});

test("never before setPhase(done), and never while she's speaking", () => {
  assert.equal(readyToHangUp({ ...base, done: false }, quiet), false);
  assert.equal(readyToHangUp({ ...base, speaking: true }, quiet), false);
});

test("setPhase(done) before her closing audio: waits for that line to be spoken", () => {
  // Her closing text arrived at 20 s, the last audio ended at 14 s (the line before). Not yet.
  assert.equal(readyToHangUp({ ...base, lastLineAt: 20_000, now: 60_000 }, quiet), false);
  // Her closing audio then plays and stops at 24 s.
  assert.equal(readyToHangUp({ ...base, lastLineAt: 20_000, voiceStoppedAt: 24_000, now: 24_500 }, quiet), false);
  assert.equal(readyToHangUp({ ...base, lastLineAt: 20_000, voiceStoppedAt: 24_000, now: 25_000 }, quiet), true);
});

test("no audio heard yet means no hang up", () => {
  assert.equal(readyToHangUp({ ...base, voiceStoppedAt: 0 }, quiet), false);
});
