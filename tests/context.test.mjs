import assert from "node:assert/strict";
import { test } from "node:test";
import { isSkill, setupUpdate, trimWords } from "../lib/call/context.ts";

const setup = { name: "Vishnu", role: "Product designer", seniority: "Senior", durationMin: 10, questionCount: 3, hasJd: true, hasCv: true };

test("the setup update names everything Meera needs", () => {
  const text = setupUpdate(setup, { cvText: "My CV", jdText: "The job" });
  assert.match(text, /Name: Vishnu\./);
  assert.match(text, /Role: senior product designer\./);
  assert.match(text, /10 minutes, 3 main questions/);
  assert.match(text, /CV:\nMy CV/);
  assert.match(text, /JOB POST:\nThe job/);
  assert.doesNotMatch(text, /FOCUS/);
});

test("no name, no CV, no job post", () => {
  const text = setupUpdate({ ...setup, name: " ", hasCv: false, hasJd: false }, { cvText: "ignored" });
  assert.match(text, /Name: not given\./);
  assert.match(text, /CV: none\. Job post: none\./);
  assert.doesNotMatch(text, /ignored/);
});

test("a focus skill asks for questions that test it", () => {
  assert.match(setupUpdate({ ...setup, focusSkill: "structure" }), /FOCUS SKILL: structure\. Pick questions that test it\./);
});

test("long texts are trimmed to 4,000 words", () => {
  const long = Array(4500).fill("word").join(" ");
  assert.equal(trimWords(long).split(" ").length, 4000);
  assert.equal(trimWords("  short  "), "short");
});

test("skills", () => {
  assert.equal(isSkill("structure"), true);
  assert.equal(isSkill("charm"), false);
});

test("resume picks up at the question she was on, with no intro", async () => {
  const { lastQuestionAsked, resumeUpdate, resumeFirstLine } = await import("../lib/call/context.ts");
  const transcript = [
    { speaker: "agent", text: "Tell me about yourself?", questionIndex: 1 },
    { speaker: "user", text: "I design.", questionIndex: 1 },
    { speaker: "agent", text: "Got it. Tell me about a stakeholder who pushed back?", questionIndex: 2 },
    { speaker: "user", text: "So", questionIndex: 2 },
  ];
  const last = lastQuestionAsked(transcript);
  assert.deepEqual(last, { question: 2, text: "Got it. Tell me about a stakeholder who pushed back?" });
  assert.match(resumeUpdate(2, last.text), /No intro\. Pick up at main question 2: .*1 main questions are done/);
  assert.match(resumeUpdate(0), /before the interview started/);
  assert.equal(resumeFirstLine(), "Sorry, we lost you. Shall we pick up where we left off?");
});

test("a resumed session keeps the call's record and question", async () => {
  const { createInterviewVM } = await import("../lib/avatar/interviewVM.ts");
  const { createCallSession } = await import("../lib/call/session.ts");
  const session = createCallSession(createInterviewVM(), { writingHoldMs: 5 });
  session.resume({
    id: "c", startedAt: new Date(0).toISOString(), setup: { role: "PM", seniority: "Mid", durationMin: 10, questionCount: 3, hasJd: false, hasCv: false },
    transcript: [{ speaker: "user", text: "x", startSec: 1, endSec: 2, questionIndex: 2 }], flags: [], metrics: [], lateAdditions: [], retries: [], status: "incomplete", interviewerId: "meera",
  });
  assert.equal(session.get().id, "c");
  assert.equal(session.get().phase, "interview");
  assert.equal(session.get().question, 2);
  assert.equal(session.get().transcript.length, 1);
});
