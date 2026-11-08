import assert from "node:assert/strict";
import { test } from "node:test";
import { callCopy, questionLabel } from "../lib/call/callCopy.ts";
import { retryFirstLine, retryUpdate } from "../lib/call/context.ts";

const base = { stage: "live", phase: "interview", speaking: false, writingNote: false, watching: false, retry: null, question: 2, total: 3, answered: 1 };

test("question labels", () => {
  assert.equal(questionLabel(0, 3), "Getting started");
  assert.equal(questionLabel(2, 3), "Question 2 of 3");
  assert.equal(questionLabel(2, null), "Question 2");
});

test("opening, listening, talking, watching, writing", () => {
  const opening = callCopy({ ...base, phase: "opening", openingLine: "Hi, I'm Meera." });
  assert.equal(opening.title, "Meera's saying hi");
  assert.equal(opening.cardLabel, "Meera says");
  assert.equal(opening.cardText, "Hi, I'm Meera.");
  assert.equal(callCopy(base).title, "Meera's listening");
  assert.equal(callCopy(base).pill, "Question 2 of 3");
  assert.equal(callCopy({ ...base, speaking: true }).title, "Meera's talking");
  assert.equal(callCopy({ ...base, watching: true }).title, "Meera checks the time");
  assert.equal(callCopy({ ...base, writingNote: true }).title, "Meera's making a note");
  assert.equal(callCopy({ ...base, stage: "writing", answered: 3 }).sub, "3 answers");
});

test("retry copy", () => {
  const retry = callCopy({ ...base, retry: { questionIndex: 2, hint: "end with what changed" }, retryQuestion: "How did it end?" });
  assert.equal(retry.title, "Take two");
  assert.equal(retry.sub, "Remember: end with what changed");
  assert.equal(retry.cardText, "How did it end?");
  assert.equal(retryFirstLine("How did it end?"), "Take two. How did it end?");
  assert.match(retryUpdate("How did it end?"), /Ask only this question/);
});
