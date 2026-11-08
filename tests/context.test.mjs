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
