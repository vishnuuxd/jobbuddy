import assert from "node:assert/strict";
import { test } from "node:test";
import { hangUpReason } from "../lib/call/close.ts";
import { liveConfig } from "../lib/live/config.ts";

const quiet = 1000;
const caps = liveConfig.endCallMaxWaitMs;
// setPhase("done") at 10 s, her closing text at 10 s, her audio 10.5 to 14 s.
const base = { doneAt: 10_000, speaking: false, lastLineAt: 10_000, voiceStartedAt: 10_500, voiceStoppedAt: 14_000, now: 15_000 };

test("the caps are 3 seconds to start and 15 to finish", () => {
  assert.deepEqual(caps, { noAudioMs: 3_000, unfinishedMs: 15_000 });
});

test("hangs up 1 second after her closing line stops", () => {
  assert.equal(hangUpReason({ ...base, now: 14_900 }, quiet, caps), null);
  assert.equal(hangUpReason(base, quiet, caps), "spoken");
});

test("never before setPhase(done), and not while she's speaking within the caps", () => {
  assert.equal(hangUpReason({ ...base, doneAt: 0 }, quiet, caps), null);
  assert.equal(hangUpReason({ ...base, speaking: true, now: 20_000 }, quiet, caps), null);
});

test("setPhase(done) before her closing audio: waits for that line to be spoken", () => {
  const early = { ...base, lastLineAt: 10_000, voiceStartedAt: 9_000, voiceStoppedAt: 9_500 };
  assert.equal(hangUpReason({ ...early, now: 12_000 }, quiet, caps), null);
  // Her closing audio starts at 12.5 s and stops at 16 s.
  const heard = { ...early, voiceStartedAt: 12_500, voiceStoppedAt: 16_000 };
  assert.equal(hangUpReason({ ...heard, now: 16_500 }, quiet, caps), null);
  assert.equal(hangUpReason({ ...heard, now: 17_000 }, quiet, caps), "spoken");
});

test("cap: no audio within 3 seconds of setPhase(done)", () => {
  const silent = { ...base, voiceStartedAt: 5_000, voiceStoppedAt: 6_000 }; // Last audio was before done.
  assert.equal(hangUpReason({ ...silent, now: 12_900 }, quiet, caps), null);
  assert.equal(hangUpReason({ ...silent, now: 13_000 }, quiet, caps), "noAudio");
});

test("cap: audio started but not finished within 15 seconds", () => {
  const long = { ...base, speaking: true, voiceStartedAt: 11_000, voiceStoppedAt: 9_000 };
  assert.equal(hangUpReason({ ...long, now: 24_900 }, quiet, caps), null);
  assert.equal(hangUpReason({ ...long, now: 25_000 }, quiet, caps), "unfinished");
});

test("audio that ended before setPhase(done) counts as heard", () => {
  // The tool call came after her closing line had already played.
  const late = { ...base, doneAt: 15_000, lastLineAt: 10_000, voiceStartedAt: 10_500, voiceStoppedAt: 14_000, now: 15_100 };
  assert.equal(hangUpReason(late, quiet, caps), "spoken");
});
