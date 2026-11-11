import assert from "node:assert/strict";
import { test } from "node:test";
import { createThinkWatch } from "../lib/call/thinking.ts";
import { liveConfig } from "../lib/live/config.ts";

function setup() {
  const state = { speaking: false, phase: "interview", thinking: false };
  const fired = [];
  const session = {
    get: () => state,
    react: (name) => (fired.push(name), true),
    setThinking: (t) => (state.thinking = t),
  };
  let now = 10_000;
  const watch = createThinkWatch(session, liveConfig, () => now);
  return { state, fired, watch, advance: (ms) => { now += ms; watch.tick(); }, at: () => now };
}

test("the thresholds: think after 600 ms, held 2.5 s at most", () => {
  assert.equal(liveConfig.thinkAfterMs, 600);
  assert.equal(liveConfig.thinkHoldMs, 2_500);
});

test("a slow reply: think fires 600 ms after I stop, and the thinking mood holds until she speaks", () => {
  const { state, fired, watch, advance } = setup();
  watch.vad(0.9); // I'm talking
  advance(300);
  watch.userTurnEnded(); // my transcript lands
  advance(200);
  assert.deepEqual(fired, []);
  advance(150); // 650 ms since my voice stopped
  assert.deepEqual(fired, ["think"]);
  assert.equal(state.thinking, true);
  advance(400);
  assert.deepEqual(fired, ["think"], "fires once per turn");
  state.speaking = true; // she starts
  state.thinking = false; // the session clears it when she speaks
  watch.herTurn();
  advance(100);
  assert.equal(state.thinking, false);
});

test("a quick reply never shows thinking", () => {
  const { state, fired, watch, advance } = setup();
  watch.vad(0.9);
  watch.userTurnEnded();
  advance(300);
  state.speaking = true;
  watch.herTurn();
  advance(1000);
  assert.deepEqual(fired, []);
});

test("a pause in the middle of my answer never fires it", () => {
  const { fired, watch, advance } = setup();
  watch.vad(0.9);
  advance(2000); // silence, but no transcript: my turn hasn't ended
  assert.deepEqual(fired, []);
});

test("thinking holds 2.5 s at most", () => {
  const { state, watch, advance } = setup();
  watch.vad(0.9);
  watch.userTurnEnded();
  advance(700);
  assert.equal(state.thinking, true);
  advance(2_400);
  assert.equal(state.thinking, true);
  advance(200);
  assert.equal(state.thinking, false);
});

test("the close ends thinking: it never shows over writing up the scorecard", () => {
  const { state, fired, watch, advance } = setup();
  watch.vad(0.9);
  watch.userTurnEnded(); // my last answer lands just before she closes
  state.phase = "done";
  advance(700);
  assert.deepEqual(fired, [], "no think once the interview is over");
  state.phase = "interview";
  watch.userTurnEnded();
  advance(700);
  assert.equal(state.thinking, true);
  state.phase = "done";
  advance(50);
  assert.equal(state.thinking, false);
});
