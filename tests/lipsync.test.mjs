import assert from "node:assert/strict";
import { test } from "node:test";
import { createInterviewVM } from "../lib/avatar/interviewVM.ts";
import { lipSyncConfig } from "../lib/lipsync/config.ts";
import { createLipSync } from "../lib/lipsync/player.ts";
import { lettersToShapes, mergeShort, visemeAt, visemeTrack } from "../lib/lipsync/visemes.ts";

// Alignment for a string where every character lasts `ms`, as ElevenLabs sends it.
const align = (text, ms = 80, gaps = {}) => {
  const chars = [...text];
  const starts = [];
  const durs = [];
  let t = 0;
  chars.forEach((c, i) => {
    starts.push(t);
    const d = gaps[i] ?? ms;
    durs.push(d);
    t += d;
  });
  return { chars, char_start_times_ms: starts, char_durations_ms: durs };
};

test("the config matches the PRD: merge under 60 ms, lead by 40 ms", () => {
  assert.equal(lipSyncConfig.minShapeMs, 60);
  assert.equal(lipSyncConfig.leadMs, 40);
});

test("letters map to shapes, with pairs read as one", () => {
  const v = (text) => lettersToShapes(align(text), 220).map((s) => s.viseme);
  assert.deepEqual(v("mama"), ["closed", "open", "closed", "open"]);
  assert.deepEqual(v("the"), ["lth", "wide"]);
  assert.deepEqual(v("food"), ["fv", "pucker", "lth"]);
  assert.deepEqual(v("she"), ["teeth", "wide"]);
  assert.deepEqual(v("Bob"), ["closed", "round", "closed"]);
});

test("a short gap between words closes the lips; a long gap or punctuation rests", () => {
  const short = lettersToShapes(align("so it", 80), 220).map((s) => s.viseme);
  assert.deepEqual(short, ["teeth", "round", "closed", "wide", "lth"]);
  const long = lettersToShapes(align("so it", 80, { 2: 300 }), 220).map((s) => s.viseme);
  assert.equal(long[2], "rest");
  const comma = lettersToShapes(align("so, it", 80), 220).map((s) => s.viseme);
  assert.equal(comma[2], "rest");
});

test("shapes under 60 ms merge into a neighbour, and repeats join", () => {
  const merged = mergeShort(
    [
      { viseme: "open", start: 0, end: 100 },
      { viseme: "teeth", start: 100, end: 130 },
      { viseme: "open", start: 130, end: 200 },
      { viseme: "round", start: 200, end: 300 },
    ],
    60,
  );
  assert.deepEqual(merged, [
    { viseme: "open", start: 0, end: 200 },
    { viseme: "round", start: 200, end: 300 },
  ]);
  assert.ok(mergeShort(lettersToShapes(align("strengths", 25), 220), 60).every((s) => s.end - s.start >= 60));
});

test("every shape shows 40 ms early, and the mouth rests after the last one", () => {
  const track = visemeTrack(align("ma", 100), lipSyncConfig);
  assert.deepEqual(track, [
    { viseme: "closed", start: -40, end: 60 },
    { viseme: "open", start: 60, end: 160 },
  ]);
  assert.equal(visemeAt(track, 0), "closed");
  assert.equal(visemeAt(track, 70), "open");
  assert.equal(visemeAt(track, 170), "rest");
});

test("the player follows the clock, and falls back to mouthOpen when a chunk has no letters", () => {
  const vm = createInterviewVM();
  let now = 1000;
  const lips = createLipSync(vm, () => now);
  lips.chunk(align("ma", 100));
  assert.deepEqual([vm.values().viseme, vm.values().lipSync], ["closed", true]);
  now = 1070;
  lips.tick();
  assert.equal(vm.values().viseme, "open");
  now = 1300;
  lips.tick();
  assert.equal(vm.values().viseme, "rest");

  lips.chunk({ chars: [], char_start_times_ms: [], char_durations_ms: [] });
  assert.deepEqual([vm.values().viseme, vm.values().lipSync], ["rest", false]);
  lips.chunk(undefined);
  assert.equal(vm.values().lipSync, false);

  lips.chunk(align("ma", 100));
  lips.stop();
  assert.deepEqual([vm.values().viseme, vm.values().lipSync], ["rest", false]);
});
