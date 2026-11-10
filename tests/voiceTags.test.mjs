import assert from "node:assert/strict";
import { test } from "node:test";
import { stripVoiceTags } from "../lib/call/voiceTags.ts";

test("removes square bracket voice tags and tidies the spaces", () => {
  assert.equal(stripVoiceTags("[calm] Great. Let's start."), "Great. Let's start.");
  assert.equal(stripVoiceTags("Okay [laughs] that's fair."), "Okay that's fair.");
  assert.equal(stripVoiceTags("Got it [warm] , thanks."), "Got it, thanks.");
  assert.equal(stripVoiceTags("Right. [pause]"), "Right.");
  assert.equal(stripVoiceTags("[sighs] [curious]  What happened next?"), "What happened next?");
  assert.equal(stripVoiceTags("[laughs], okay."), "okay.");
});

test("a line that was only tags becomes empty, and plain text is untouched", () => {
  assert.equal(stripVoiceTags("[laughs]"), "");
  assert.equal(stripVoiceTags("How did that turn out?"), "How did that turn out?");
});
