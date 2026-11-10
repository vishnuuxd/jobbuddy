import assert from "node:assert/strict";
import { test } from "node:test";
import { retryPrompt, scorecardPrompt, trimForScoring } from "../lib/scorecard/prompt.ts";
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

test("voice tags never reach the scorecard", () => {
  const prompt = scorecardPrompt({ ...call, transcript: [{ speaker: "agent", text: "[calm] Tell me about a time.", startSec: 0, endSec: 2, questionIndex: 1 }, { speaker: "agent", text: "[laughs]", startSec: 2, endSec: 3 }] });
  assert.ok(prompt.includes("Meera: Tell me about a time."));
  assert.ok(!prompt.includes("[calm]") && !prompt.includes("[laughs]"));
});

test("a long transcript is trimmed by shortening her lines, never my answers", () => {
  const words = (n, w) => Array(n).fill(w).join(" ");
  const lines = [];
  for (let i = 0; i < 40; i++) {
    lines.push({ speaker: "agent", text: words(40, "meera"), startSec: i * 10, endSec: i * 10 + 2 });
    lines.push({ speaker: "user", text: words(90, "answer"), startSec: i * 10 + 2, endSec: i * 10 + 9 });
  }
  // 1,600 of hers + 3,600 of mine: over the 5,000 budget. At 30 words each (plus "…") hers are 1,240: under.
  const trimmed = trimForScoring(lines);
  assert.equal(trimmed.length, lines.length);
  assert.ok(trimmed.filter((line) => line.speaker === "user").every((line, i) => line.text === lines[i * 2 + 1].text));
  assert.equal(trimmed[0].text.split(" ").filter((w) => w === "meera").length, 30);
  // A short call is left as it is.
  assert.deepEqual(trimForScoring(lines.slice(0, 4)), lines.slice(0, 4));
  // Still over at 30 words: hers go down to 12.
  assert.equal(trimForScoring(lines, 3_000)[0].text.split(" ").filter((w) => w === "meera").length, 12);
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
