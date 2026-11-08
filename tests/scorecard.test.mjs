import assert from "node:assert/strict";
import { test } from "node:test";
import { retryPrompt, scorecardPrompt } from "../lib/scorecard/prompt.ts";
import { scorecardSchema, validateAnswer, validateScorecard } from "../lib/scorecard/schema.ts";
import { scoredCall } from "./fixtures.mjs";

const call = {
  ...scoredCall(),
  cvText: "CV text here",
  jdText: "Job post here",
  transcript: [
    { speaker: "agent", text: "Tell me about a time.", startSec: 124, endSec: 128, questionIndex: 2 },
    { speaker: "user", text: "So I aligned everyone.", startSec: 131, endSec: 140, questionIndex: 2 },
  ],
};

test("the prompt carries the rubric, rules and every input the PRD lists", () => {
  const prompt = scorecardPrompt(call);
  for (const part of ["RUBRIC", "SENIORITY BAR", "[your number]", "ROLE: Senior Product designer", "DELIVERY METRICS", "FLAGS LOGGED", "CV:\nCV text here", "JOB DESCRIPTION:\nJob post here", "[2:04] (Q2) Meera: Tell me about a time.", "[2:11] (Q2) Candidate: So I aligned everyone."]) {
    assert.ok(prompt.includes(part), part);
  }
});

test("the retry prompt scores one question", () => {
  const prompt = retryPrompt(call, 2, "Stakeholder pushback", [{ speaker: "user", text: "New answer", startSec: 3, endSec: 9 }]);
  assert.match(prompt, /RETRY of one question: "Stakeholder pushback"/);
  assert.match(prompt, /Candidate: New answer/);
});

test("a good scorecard passes and scores are kept in range", () => {
  const raw = structuredClone(call.scorecard);
  raw.answers[0].scores.clarity = 9;
  raw.answers[0].flagged = { type: "rambling", quote: "and then", atSeconds: 10, whyItMatters: "x" };
  raw.answers[0].rewrite = { original: "a", improved: "b", whatChanged: "c" };
  const result = validateScorecard(raw);
  assert.equal(result.answers[0].scores.clarity, 5);
  assert.equal(result.answers[0].flagged.type, "rambling");
  assert.equal(result.answers[0].rewrite.improved, "b");
});

test("unusable scorecards are rejected", () => {
  assert.equal(validateScorecard(null), null);
  assert.equal(validateScorecard({ summary: {}, answers: [] }), null);
  const badSkill = structuredClone(call.scorecard);
  badSkill.summary.practiceNext = "charm";
  assert.equal(validateScorecard(badSkill), null);
  assert.equal(validateAnswer({ scores: { clarity: "x" } }), null);
});

test("an unknown flag type is dropped, not trusted", () => {
  const answer = validateAnswer({ questionIndex: 1, question: "Q", scores: { clarity: 3, structure: 3, evidence: 3, relevance: 3, delivery: 3 }, flagged: { type: "rude", quote: "x" } });
  assert.equal(answer.flagged, undefined);
});

test("the schema lists every PRD field", () => {
  assert.deepEqual(scorecardSchema.required, ["summary", "answers"]);
  assert.ok(scorecardSchema.properties.summary.required.includes("oneThing"));
});

test("flags land on the line they quote, or the nearest line in time", async () => {
  const { transcriptItems } = await import("../lib/scorecard/transcript.ts");
  const call = {
    transcript: [
      { speaker: "agent", text: "How did it end?", startSec: 120, endSec: 124 },
      { speaker: "user", text: "So I aligned everyone and we moved on to the next sprint.", startSec: 130, endSec: 140 },
      { speaker: "user", text: "I think it kind of went well? I guess.", startSec: 200, endSec: 205 },
    ],
    flags: [
      { type: "no_result", quote: "…so I aligned everyone and we moved on", atSeconds: 0, source: "agent" },
      { type: "hedging", quote: "words that aren't there", atSeconds: 198, source: "client" },
    ],
  };
  const items = transcriptItems(call);
  assert.equal(items[0].flag, undefined);
  assert.equal(items[1].flag.type, "no_result");
  assert.equal(items[2].flag.type, "hedging");
});
