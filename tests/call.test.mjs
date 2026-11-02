import assert from "node:assert/strict";
import { test } from "node:test";
import { createClientTools } from "../lib/agent/clientTools.ts";
import { createInterviewVM } from "../lib/avatar/interviewVM.ts";
import { createCallSession, totalQuestions } from "../lib/call/session.ts";

function setup(mode = "short") {
  const vm = createInterviewVM();
  const session = createCallSession(vm);
  const tools = createClientTools(session);
  session.start();
  const fired = [];
  vm.onTrigger((name) => fired.push(name));
  return { vm, session, tools, fired, setupArgs: { role: "Designer", seniority: "Senior", mode, hasJd: false, hasCv: "true" } };
}

test("mood follows the phase, and her voice wins", () => {
  const { vm, session, tools } = setup();
  assert.equal(vm.values().mood, "intake");
  session.setSpeaking(true);
  assert.equal(vm.values().mood, "talking");
  tools.setPhase({ name: "interview" });
  assert.equal(vm.values().mood, "talking");
  session.setSpeaking(false);
  assert.equal(vm.values().mood, "listening");
  session.end();
  assert.equal(vm.values().mood, "idle");
});

test("react fires valid triggers and is logged, and rejects others", () => {
  const { session, tools, fired } = setup();
  assert.equal(tools.react({ name: "nod" }), "ok");
  assert.equal(tools.react({ name: "wave" }), "ignored");
  assert.deepEqual(fired, ["nod"]);
  assert.equal(session.get().reactions.length, 1);
});

test("setPhase only moves forward", () => {
  const { session, tools } = setup();
  assert.equal(tools.setPhase({ name: "nonsense" }), "ignored");
  assert.equal(tools.setPhase({ name: "idle" }), "ignored");
  tools.setPhase({ name: "interview" });
  assert.equal(tools.setPhase({ name: "intake" }), "ignored");
  assert.equal(session.get().phase, "interview");
  tools.setPhase({ name: "done" });
  assert.equal(session.get().phase, "done");
});

test("setSetup saves the intake result and rejects a bad mode", () => {
  const { session, tools, setupArgs } = setup();
  assert.equal(tools.setSetup({ ...setupArgs, mode: "long" }), "ignored");
  assert.equal(session.get().setup, null);
  tools.setSetup(setupArgs);
  assert.equal(session.get().setup.hasCv, true);
  assert.equal(totalQuestions(session.get().setup), 3);
});

test("nextQuestion counts for itself, needs a new turn and stops at the total", () => {
  const { session, tools, setupArgs } = setup();
  tools.setSetup(setupArgs);
  assert.equal(tools.nextQuestion({ index: 1 }), "ignored"); // Still in intake.
  tools.setPhase({ name: "interview" });
  tools.nextQuestion({ index: 9 });
  assert.equal(session.get().question, 1);
  assert.equal(tools.nextQuestion({ index: 2 }), "ignored"); // Same turn.
  session.noteUserMessage();
  tools.nextQuestion({ index: 2 });
  session.noteUserMessage();
  tools.nextQuestion({ index: 3 });
  session.noteUserMessage();
  assert.equal(tools.nextQuestion({ index: 4 }), "ignored"); // Past the total.
  assert.equal(session.get().question, 3);
});

test("mouthOpen stays between 0 and 100", () => {
  const vm = createInterviewVM();
  vm.set({ mouthOpen: 400 });
  assert.equal(vm.values().mouthOpen, 100);
});
