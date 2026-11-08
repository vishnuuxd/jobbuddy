import assert from "node:assert/strict";
import { test } from "node:test";
import { callName, nextCallNumber, numberCalls, titleCase } from "../lib/home/callName.ts";
import { callScore, overallScore, retryLift, scoreWord } from "../lib/progress/overall.ts";
import { answer, scoredCall, scores } from "./fixtures.mjs";

test("the overall score averages every skill of every answer, to one decimal", () => {
  assert.equal(overallScore([answer(1, scores(4, 3, 3, 4, 3)), answer(2, scores(4, 2, 3, 4, 3))]), 3.3);
  assert.equal(overallScore([answer(1, scores(5, 5, 5, 5, 4))]), 4.8);
  assert.equal(overallScore([]), null);
});

test("the bands and their words", () => {
  assert.equal(scoreWord(1), "Not there yet");
  assert.equal(scoreWord(2.4), "Not there yet");
  assert.equal(scoreWord(2.5), "Getting there");
  assert.equal(scoreWord(3.4), "Getting there");
  assert.equal(scoreWord(3.5), "Interview ready");
  assert.equal(scoreWord(4.2), "Interview ready");
  assert.equal(scoreWord(4.3), "Strong");
  assert.equal(scoreWord(5), "Strong");
});

test("retries never change the score, and their lift is shown on its own", () => {
  const call = scoredCall({ retries: [{ questionIndex: 2, at: "a", transcript: [], answer: answer(2, scores(5, 5, 5, 5, 5)) }] });
  const before = callScore(scoredCall());
  const after = callScore(call);
  assert.equal(after.score, before.score);
  // Question 2 goes from 16 to 25 points: 9 more over 15 skill scores, so the average rises by 0.6.
  assert.equal(retryLift(call), 0.6);
});

test("a worse retry lifts nothing", () => {
  const call = scoredCall({ retries: [{ questionIndex: 2, at: "a", transcript: [], answer: answer(2, scores(1, 1, 1, 1, 1)) }] });
  assert.equal(retryLift(call), 0);
});

test("no score for incomplete or failed calls", () => {
  assert.equal(callScore(scoredCall({ status: "incomplete" })), null);
  assert.equal(callScore(scoredCall({ status: "scoring_failed", scorecard: undefined })), null);
  assert.equal(callScore(scoredCall()).word, scoreWord(callScore(scoredCall()).score));
});

test("call names", () => {
  assert.equal(titleCase("senior product designer"), "Senior Product Designer");
  assert.equal(callName({ role: "UX researcher", seniority: "Lead" }, 3), "Lead UX Researcher 3");
  assert.equal(callName({ role: "Product designer", seniority: "Senior" }, 12), "Senior Product Designer 12");
});

test("numbers count per role and seniority, and never reuse a deleted number", () => {
  const pd = { role: "Product designer", seniority: "Senior" };
  const calls = [{ setup: pd, number: 1 }, { setup: pd, number: 3 }, { setup: { role: "PM", seniority: "Mid" }, number: 1 }];
  assert.equal(nextCallNumber(calls, pd), 4);
  assert.equal(nextCallNumber(calls, { role: "product designer", seniority: "senior" }), 4);
  assert.equal(nextCallNumber(calls, { role: "Sales", seniority: "Junior" }), 1);
});

test("existing calls are numbered in date order", () => {
  const pd = { role: "Product designer", seniority: "Senior" };
  const numbers = numberCalls([
    { id: "c", setup: pd, startedAt: "2026-11-03" },
    { id: "a", setup: pd, startedAt: "2026-11-01" },
    { id: "x", setup: undefined, startedAt: "2026-11-02" },
    { id: "b", setup: { role: "PM", seniority: "Mid" }, startedAt: "2026-11-02" },
  ]);
  assert.deepEqual([...numbers.entries()].sort(), [["a", 1], ["b", 1], ["c", 2]]);
});
