import assert from "node:assert/strict";
import { test } from "node:test";
import { openingLine } from "../lib/call/opening.ts";

const setup = { name: "Vishnu", role: "Product designer", seniority: "Senior", durationMin: 10 };

test("CV and job post", () => {
  assert.equal(
    openingLine({ ...setup, hasCv: true, hasJd: true }),
    "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role. I've read your CV and the job post. Ready?",
  );
});

test("CV only", () => {
  assert.equal(
    openingLine({ ...setup, hasCv: true, hasJd: false }),
    "Hi Vishnu, I'm Meera. Ten minute screen for the senior product designer role. I've seen your CV. Ready?",
  );
});

test("job post only", () => {
  assert.equal(
    openingLine({ ...setup, hasCv: false, hasJd: true }),
    "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role. I've read the job post. Ready?",
  );
});

test("neither", () => {
  assert.equal(
    openingLine({ ...setup, hasCv: false, hasJd: false }),
    "Hi Vishnu, I'm Meera. Ten minutes on the senior product designer role today. Shall we start?",
  );
});

test("no name, or only spaces, gives the short greeting", () => {
  for (const name of [undefined, "", "   "]) {
    assert.equal(
      openingLine({ ...setup, name, hasCv: false, hasJd: false }),
      "Hi, I'm Meera. Ten minutes on the senior product designer role today. Shall we start?",
    );
  }
});

test("other lengths and roles read naturally", () => {
  assert.equal(
    openingLine({ ...setup, durationMin: 5, role: "UX researcher", seniority: "Lead", hasCv: true, hasJd: false }),
    "Hi Vishnu, I'm Meera. Five minute screen for the lead UX researcher role. I've seen your CV. Ready?",
  );
  assert.equal(
    openingLine({ ...setup, durationMin: 20, role: "PM", seniority: "Mid", hasCv: false, hasJd: true }),
    "Hi Vishnu, I'm Meera. Twenty minutes on the mid PM role. I've read the job post. Ready?",
  );
});
