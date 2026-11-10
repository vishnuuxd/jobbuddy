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
// Real chunks from a call on 11 Nov: "…and how you appro" + "ach design leaders", and " product designer ".
const approach = {
  chars: [..."and how you appro"],
  char_start_times_ms: [0, 80, 160, 240, 320, 373, 427, 480, 560, 573, 587, 600, 640, 688, 736, 784, 832],
  char_durations_ms: [80, 80, 80, 80, 53, 54, 53, 80, 13, 14, 13, 40, 48, 48, 48, 48, 48],
};
const design = {
  chars: [..."ach design leaders"],
  char_start_times_ms: [0, 53, 107, 160, 360, 393, 427, 460, 493, 527, 560, 640, 686, 731, 777, 823, 869, 914],
  char_durations_ms: [53, 54, 53, 200, 33, 34, 33, 33, 34, 33, 80, 46, 45, 46, 46, 46, 45, 46],
};
const product = {
  chars: [..." product designer "],
  char_start_times_ms: [0, 80, 114, 149, 183, 217, 251, 286, 320, 400, 440, 480, 520, 560, 600, 640, 680, 720],
  char_durations_ms: [80, 34, 35, 34, 34, 34, 35, 34, 80, 40, 40, 40, 40, 40, 40, 40, 40, 80],
};
const longest = (track) => Math.max(...track.map((s) => s.end - s.start));

test("the config matches the PRD: shapes of at least 60 ms, 40 ms early, none held past 250 ms", () => {
  assert.equal(lipSyncConfig.minShapeMs, 60);
  assert.equal(lipSyncConfig.leadMs, 40);
  assert.equal(lipSyncConfig.maxHoldMs, 250);
});

test("the letter map: d s t teeth, e i wide, l th lth, p b m closed", () => {
  const v = (text) => lettersToShapes(align(text), 220).map((s) => s.viseme);
  assert.deepEqual(v("dst"), ["teeth", "teeth", "teeth"]);
  assert.deepEqual(v("ei"), ["wide", "wide"]);
  assert.deepEqual(v("lth"), ["lth", "lth"]);
  assert.deepEqual(v("pbm"), ["closed", "closed", "closed"]);
  assert.deepEqual(v("mama"), ["closed", "open", "closed", "open"]);
  assert.deepEqual(v("food"), ["fv", "pucker", "teeth"]);
  assert.deepEqual(v("she"), ["teeth", "wide"]);
});

test("a short gap between words closes the lips; a long gap or punctuation rests", () => {
  const short = lettersToShapes(align("so it", 80), 220).map((s) => s.viseme);
  assert.deepEqual(short, ["teeth", "round", "closed", "wide", "teeth"]);
  assert.equal(lettersToShapes(align("so it", 80, { 2: 300 }), 220).map((s) => s.viseme)[2], "rest");
  assert.equal(lettersToShapes(align("so, it", 80), 220).map((s) => s.viseme)[2], "rest");
});

test("quick letters group into shapes of 60 ms or more, without a word collapsing into one shape", () => {
  // The old merge folded every short letter into the one before: " product" became one closed shape.
  for (const chunk of [approach, design, product]) {
    const shapes = mergeShort(lettersToShapes(chunk, 220), 60);
    assert.ok(shapes.every((s) => s.end - s.start >= 60 || shapes.length === 1), "every shape at least 60 ms");
    assert.ok(longest(shapes) <= 250, `no shape over 250 ms in "${chunk.chars.join("")}": ${longest(shapes)}`);
  }
  const productShapes = visemeTrack(product, lipSyncConfig).map((s) => s.viseme);
  assert.ok(new Set(productShapes).size >= 4, `" product designer " shows several shapes: ${productShapes.join(" ")}`);
  // "approach design": the open mouth never holds for long, and design shows teeth and wide.
  for (const chunk of [approach, design]) {
    for (const s of visemeTrack(chunk, lipSyncConfig)) if (s.viseme === "open") assert.ok(s.end - s.start <= 160, `open held ${s.end - s.start} ms`);
  }
  const d = visemeTrack(design, lipSyncConfig).map((s) => s.viseme);
  assert.ok(d.includes("teeth") && d.includes("wide"), d.join(" "));
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

// A player on a fake clock, ticked every 16 ms like a frame loop.
function player() {
  const vm = createInterviewVM();
  let now = 1000;
  const lips = createLipSync(vm, () => now);
  const run = (ms, step = 16) => {
    for (let t = 0; t < ms; t += step) {
      now += step;
      lips.tick();
    }
  };
  return { vm, lips, run, at: () => now, jump: (ms) => (now += ms) };
}
const state = (vm) => [vm.values().viseme, vm.values().lipSync];

test("stop: end of turn, cut off, call ended or tab hidden all rest the mouth at once", () => {
  const { vm, lips, run } = player();
  lips.chunk(align("hello there", 80));
  run(200);
  assert.notEqual(vm.values().viseme, "rest");
  lips.stop();
  assert.deepEqual(state(vm), ["rest", false]);
  run(500); // nothing restarts it until the next chunk
  assert.deepEqual(state(vm), ["rest", false]);
});

test("stop: a chunk that ends with no next one rests within 100 ms of its last letter", () => {
  const { vm, lips, run } = player();
  lips.chunk(align("ma", 100)); // last letter ends at 200 ms of audio
  run(200);
  assert.deepEqual(state(vm), ["rest", false]);
});

test("stall: a frame gap past 150 ms drops the old timeline until the next chunk", () => {
  const { vm, lips, run, jump } = player();
  lips.chunk(align("hello there friend", 80));
  run(100);
  jump(400); // the page froze; playback kept going
  lips.tick();
  assert.deepEqual(state(vm), ["rest", false]);
  run(300); // the old timeline doesn't come back
  assert.deepEqual(state(vm), ["rest", false]);
  lips.chunk(align("ok", 80)); // the next chunk starts a fresh one
  assert.equal(vm.values().lipSync, true);
});

test("stall: a late chunk replaces the old timeline instead of continuing it", () => {
  const { vm, lips, run } = player();
  lips.chunk(align("aaaaaaaaaa", 80));
  run(100);
  lips.chunk(align("mmm", 80)); // arrives while the old one still has letters left
  run(16);
  assert.equal(vm.values().viseme, "closed");
});

test("no shape holds past 250 ms: a long letter hands the mouth to mouthOpen", () => {
  const { vm, lips, run } = player();
  lips.chunk(align("a", 600));
  run(200);
  assert.deepEqual(state(vm), ["open", true]);
  run(150);
  assert.deepEqual(state(vm), ["open", false]);
});

test("a chunk with no letters hands the mouth to mouthOpen", () => {
  const { vm, lips } = player();
  lips.chunk({ chars: [], char_start_times_ms: [], char_durations_ms: [] });
  assert.deepEqual(state(vm), ["rest", false]);
  lips.chunk(undefined);
  assert.deepEqual(state(vm), ["rest", false]);
});
