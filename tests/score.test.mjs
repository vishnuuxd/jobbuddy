import assert from "node:assert/strict";
import { test } from "node:test";
import { callPill } from "../lib/home/format.ts";
import { bestGain, bestRetry, callSkillScores, personalBests, retryChange, weakestSkill } from "../lib/progress/score.ts";
import { toSetup, upgradeCall } from "../lib/store/migrate.ts";
import { answer, scoredCall, scores } from "./fixtures.mjs";

test("call skill scores are rounded averages", () => {
  assert.deepEqual(callSkillScores(scoredCall()), { clarity: 4, structure: 2, evidence: 3, relevance: 4, delivery: 3 });
  assert.equal(callSkillScores({}), null);
});

test("weakest skill", () => {
  assert.equal(weakestSkill(callSkillScores(scoredCall())), "structure");
});

test("retry change per skill and in total", () => {
  const original = answer(2, scores(4, 2, 3, 4, 3));
  const change = retryChange(original, { answer: answer(2, scores(4, 4, 4, 4, 3)) });
  assert.equal(change.perSkill.structure, 2);
  assert.equal(change.perSkill.evidence, 1);
  assert.equal(change.total, 3);
});

test("best retry and best gain", () => {
  const retries = [
    { questionIndex: 2, at: "a", answer: answer(2, scores(4, 3, 3, 4, 3)), transcript: [] },
    { questionIndex: 2, at: "b", answer: answer(2, scores(4, 4, 4, 4, 3)), transcript: [] },
  ];
  const call = scoredCall({ retries });
  assert.equal(bestRetry(call, 2).at, "b");
  assert.equal(bestRetry(call, 1), null);
  assert.deepEqual(bestGain(call), { skill: "structure", amount: 2 });
});

test("personal bests count completed calls only", () => {
  const strong = scoredCall({ scorecard: { ...scoredCall().scorecard, answers: [answer(1, scores(5, 5, 5, 5, 5))] }, status: "scoring_failed" });
  assert.deepEqual(personalBests([scoredCall(), strong]), { clarity: 4, structure: 2, evidence: 3, relevance: 4, delivery: 3 });
});

test("pills: incomplete, failed, improved, weakest", () => {
  assert.equal(callPill({ status: "incomplete", retries: [] }).label, "Incomplete");
  assert.equal(callPill({ status: "scoring_failed", retries: [] }).label, "No scorecard yet");
  assert.equal(callPill(scoredCall()).label, "Structure 2");
  const improved = scoredCall({ retries: [{ questionIndex: 2, at: "a", answer: answer(2, scores(4, 3, 3, 4, 3)), transcript: [] }] });
  assert.deepEqual(callPill(improved), { tone: "mint", label: "+1 Structure" });
});

test("v1 calls upgrade to the sheet's setup shape", () => {
  assert.deepEqual(toSetup({ role: "PM", seniority: "Mid", mode: "short", hasJd: false, hasCv: true }), {
    role: "PM", seniority: "Mid", hasJd: false, hasCv: true, durationMin: 10, questionCount: 3,
  });
  assert.equal(toSetup({ role: "PM", seniority: "Mid", mode: "full", hasJd: false, hasCv: false }).questionCount, 5);
  const upgraded = upgradeCall({ id: "x", retries: "nope", setup: undefined });
  assert.deepEqual(upgraded.retries, []);
  assert.deepEqual(upgraded.lateAdditions, []);
});
