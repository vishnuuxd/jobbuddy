import assert from "node:assert/strict";
import { test } from "node:test";
import { createClientTools } from "../lib/agent/clientTools.ts";
import { createInterviewVM } from "../lib/avatar/interviewVM.ts";
import { createCallSession, totalQuestions } from "../lib/call/session.ts";

const sheetSetup = { role: "Product designer", seniority: "Senior", durationMin: 10, questionCount: 3, hasJd: false, hasCv: true };

function setup() {
  const vm = createInterviewVM();
  const session = createCallSession(vm, { writingHoldMs: 5 });
  const tools = createClientTools(session);
  session.start("call-1", sheetSetup, { cvText: "CV text" });
  const fired = [];
  vm.onTrigger((name) => fired.push(name));
  return { vm, session, tools, fired };
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
  assert.equal(tools.setPhase({ name: "opening" }), "ignored");
  assert.equal(session.get().phase, "interview");
  tools.setPhase({ name: "done" });
  assert.equal(session.get().phase, "done");
});

test("the setup comes from the sheet, and setSetup is gone", () => {
  const { session, tools } = setup();
  assert.equal(session.get().setup.questionCount, 3);
  assert.equal(session.get().cvText, "CV text");
  assert.equal(totalQuestions(session.get().setup), 3);
  assert.equal(tools.setSetup, undefined);
});

test("the opening is a phase, and the agent's old intake name still works", () => {
  const { session, tools } = setup();
  assert.equal(session.get().phase, "opening");
  assert.equal(tools.setPhase({ name: "intake" }), "ok");
  assert.equal(session.get().phase, "opening");
  assert.equal(tools.setPhase({ name: "opening" }), "ok");
});

test("nextQuestion counts for itself, needs a new turn and stops at the total", () => {
  const { session, tools } = setup();
  assert.equal(tools.nextQuestion({ index: 1 }), "ignored"); // Still in the opening.
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

test("flag is ignored outside the interview and plays the writing mood inside it", async () => {
  const { vm, session, tools } = setup();
  assert.equal(tools.flag({ type: "rambling", quote: "x" }), "ignored");
  tools.setPhase({ name: "interview" });
  session.setSpeaking(true);
  assert.equal(tools.flag({ type: "nope", quote: "x" }), "ignored");
  assert.equal(tools.flag({ type: "rambling", quote: "and then" }), "ok");
  assert.equal(vm.values().mood, "writing");
  assert.equal(session.get().flags[0].source, "agent");
  await new Promise((done) => setTimeout(done, 15));
  assert.equal(vm.values().mood, "talking");
});

test("answered questions count main questions I spoke on", async () => {
  const { answeredQuestions } = await import("../lib/call/session.ts");
  const line = (speaker, questionIndex) => ({ speaker, text: "x", startSec: 0, endSec: 1, questionIndex });
  assert.equal(answeredQuestions({ transcript: [line("agent", 1), line("user", undefined)] }), 0);
  assert.equal(answeredQuestions({ transcript: [line("user", 1), line("user", 1), line("user", 2), line("agent", 3)] }), 2);
});

test("a retry starts in the interview on its question and ignores nextQuestion", () => {
  const vm = createInterviewVM();
  const session = createCallSession(vm, { writingHoldMs: 5 });
  const tools = createClientTools(session);
  session.startRetry("r", sheetSetup, { callId: "c", questionIndex: 2 });
  assert.equal(session.get().phase, "interview");
  assert.equal(session.get().question, 2);
  session.noteUserMessage();
  assert.equal(tools.nextQuestion({ index: 3 }), "ignored");
  assert.equal(session.get().question, 2);
  assert.equal(vm.values().mood, "listening");
});

// Her question's text and nextQuestion can arrive in either order (PRD.md, Call behavior).
function interview() {
  const s = setup();
  s.tools.setPhase({ name: "interview" });
  return s;
}
const tags = (session) => session.get().transcript.map((l) => `${l.speaker}:${l.questionIndex ?? 0}`);

test("her question 1 line is tagged 1 when it arrives before nextQuestion", async () => {
  const { session, tools } = interview();
  session.addTranscript("user", "Sure, let's start.", Date.now());
  session.addTranscript("agent", "To kick things off, tell me about your background.", Date.now());
  assert.deepEqual(tags(session), ["user:0", "agent:0"]);
  tools.nextQuestion({ index: 1 });
  assert.deepEqual(tags(session), ["user:0", "agent:1"]);
  const { lastQuestionAsked } = await import("../lib/call/context.ts");
  assert.equal(lastQuestionAsked(session.get().transcript).text, "To kick things off, tell me about your background.");
});

test("her question 1 line is tagged 1 when it arrives after nextQuestion", () => {
  const { session, tools } = interview();
  session.addTranscript("user", "Sure, let's start.", Date.now());
  tools.nextQuestion({ index: 1 });
  session.addTranscript("agent", "To kick things off, tell me about your background.", Date.now());
  assert.deepEqual(tags(session), ["user:0", "agent:1"]);
});

test("only her current turn is retagged, and a cut-in takes the tag back", () => {
  const { session, tools } = interview();
  session.addTranscript("user", "Ready.", Date.now());
  tools.nextQuestion({ index: 1 });
  session.addTranscript("agent", "Tell me about your background.", Date.now());
  session.noteUserMessage(); // as the call screen does with my transcript
  session.addTranscript("user", "Five years in product design.", Date.now());
  session.addTranscript("agent", "Thanks. Tell me about a disagreement.", Date.now());
  tools.nextQuestion({ index: 2 });
  assert.deepEqual(tags(session), ["user:0", "agent:1", "user:1", "agent:2"]);
  session.dropQuestionFromThisTurn(); // I cut in: her question 2 didn't happen yet
  assert.deepEqual(tags(session), ["user:0", "agent:1", "user:1", "agent:1"]);
});

test("the scorecard prompt labels her question 1 line Q1 in either order", async () => {
  const { session, tools } = interview();
  session.addTranscript("user", "Ready.", Date.now());
  session.addTranscript("agent", "Tell me about your background.", Date.now());
  tools.nextQuestion({ index: 1 });
  const { scorecardPrompt } = await import("../lib/scorecard/prompt.ts");
  const { toCallRecord } = await import("../lib/call/session.ts");
  assert.match(scorecardPrompt(toCallRecord(session.get())), /\(Q1\) Meera: Tell me about your background\./);
});
