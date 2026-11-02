import assert from "node:assert/strict";
import { test } from "node:test";
import { createInterviewVM } from "../lib/avatar/interviewVM.ts";
import { createCallSession } from "../lib/call/session.ts";
import { liveConfig } from "../lib/live/config.ts";
import { createLiveRules } from "../lib/live/rules.ts";
import { countFillers, countHedges } from "../lib/live/wordLists.ts";

function harness() {
  let now = 1_000_000;
  const vm = createInterviewVM();
  const session = createCallSession(vm, liveConfig, () => now);
  const sent = [];
  const rules = createLiveRules(session, (text) => sent.push(text), liveConfig, () => now);
  const fired = [];
  vm.onTrigger((name) => fired.push(name));
  session.start("c");
  session.setPhase("interview");
  session.nextQuestion();
  // Talks steadily until `ms` have passed, in 200 ms steps.
  const talk = (ms) => {
    for (let t = 0; t < ms; t += 200) {
      rules.vad(0.9);
      rules.tick();
      now += 200;
    }
  };
  const quiet = (ms) => {
    for (let t = 0; t < ms; t += 200) {
      rules.vad(0.1);
      rules.tick();
      now += 200;
    }
  };
  return { session, rules, sent, fired, talk, quiet };
}

test("the long answer ladder fires in order, once each", () => {
  const { sent, fired, talk } = harness();
  talk(74_000);
  assert.deepEqual(fired, []);
  talk(2_000);
  assert.deepEqual(fired, ["glanceDown"]);
  talk(30_000);
  assert.deepEqual(fired, ["glanceDown", "checkWatch"]);
  assert.equal(sent.length, 0);
  talk(40_000);
  assert.equal(sent.length, 1);
  assert.deepEqual(fired, ["glanceDown", "checkWatch"]);
});

test("expectant fires after 1.5 s of silence, including early in an answer", () => {
  const { fired, talk, quiet } = harness();
  talk(3_000);
  quiet(1_200);
  assert.deepEqual(fired, []);
  quiet(600);
  assert.deepEqual(fired, ["expectant"]);
  quiet(5_000);
  assert.deepEqual(fired, ["expectant"]);
  talk(1_000);
  quiet(2_000);
  assert.deepEqual(fired, ["expectant", "expectant"]);
});

test("no expectant look before I've started answering", () => {
  const { fired, quiet } = harness();
  quiet(10_000);
  assert.deepEqual(fired, []);
});

test("filler and hedge bursts raise a brow once, after the quiet start", () => {
  const { session, rules, fired, talk } = harness();
  talk(25_000);
  rules.userMessage("um uh um uh um uh maybe i think probably");
  rules.userMessage("um um um");
  assert.deepEqual(fired, ["browRaise"]);
  assert.equal(session.get().flags[0].source, "client");
  assert.equal(session.get().flags.length, 1);
});

test("a burst inside the quiet start doesn't fire", () => {
  const { rules, fired, talk } = harness();
  talk(10_000);
  rules.userMessage("um uh um uh um uh");
  assert.deepEqual(fired, []);
});

test("metrics leave out her speaking time and give words per minute", () => {
  const { session, rules, talk } = harness();
  talk(30_000);
  rules.herTurn();
  session.setSpeaking(true);
  talk(30_000); // Her voice through the speaker doesn't count.
  rules.userMessage(Array(60).fill("word").join(" "));
  const [metric] = session.get().metrics;
  assert.ok(Math.abs(metric.seconds - 30) < 0.5);
  assert.ok(Math.abs(metric.wpm - 120) < 3);
});

test("cutting in on her turn drops her nextQuestion and joins the answer", () => {
  const { session, rules, talk } = harness();
  talk(30_000);
  session.noteUserMessage();
  rules.herTurn();
  session.setSpeaking(true);
  session.nextQuestion();
  assert.equal(session.get().question, 2);
  session.setSpeaking(false);
  rules.interruption();
  assert.equal(session.get().question, 1);
  talk(5_000);
  rules.herTurn();
  assert.deepEqual(session.get().lateAdditions, [1]);
  assert.ok(session.get().metrics[0].seconds > 34);
});

test("an addition past 15 seconds is a restart, sent once", () => {
  const { session, rules, sent, talk } = harness();
  talk(5_000);
  rules.herTurn();
  rules.interruption();
  talk(14_000);
  assert.equal(sent.length, 0);
  talk(10_000);
  assert.equal(sent.length, 1);
  assert.equal(session.get().question, 1);
});

test("nothing runs outside the interview", () => {
  const { session, rules, fired, talk } = harness();
  session.setPhase("done");
  talk(130_000);
  assert.deepEqual(fired, []);
  assert.equal(rules.answering(), false);
});

test("word lists", () => {
  assert.equal(countFillers("Um, so, you know, uhh the summer"), 3);
  assert.equal(countHedges("I think maybe it was kind of good"), 3);
});
