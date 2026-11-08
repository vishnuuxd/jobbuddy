import assert from "node:assert/strict";
import { test } from "node:test";
import { faceFor, triggerMs } from "../lib/avatar/meeraFace.ts";

const at = (name, fraction = 0.4) => [{ [name]: 0 }, triggerMs[name] * fraction];

test("each mood has its own face", () => {
  assert.equal(faceFor({ mood: "listening" }, {}, 0).mouth, "none");
  assert.equal(faceFor({ mood: "intake" }, {}, 0).mouth, "smile");
  assert.equal(faceFor({ mood: "talking" }, {}, 0).mouth, "talk");
  assert.equal(faceFor({ mood: "skeptical" }, {}, 0).mouth, "wavy");
  assert.equal(faceFor({ mood: "writing" }, {}, 0).notepad, true);
});

test("checkWatch shows the ring and a flat mouth, then lets go", () => {
  const [fired, now] = at("checkWatch");
  const face = faceFor({ mood: "listening" }, fired, now);
  assert.equal(face.ring, true);
  assert.equal(face.mouth, "flat");
  assert.equal(faceFor({ mood: "listening" }, fired, triggerMs.checkWatch + 1).ring, false);
});

test("her voice keeps the talking mouth over expression triggers", () => {
  for (const name of ["browRaise", "checkWatch", "smile"]) {
    const [fired, now] = at(name);
    assert.equal(faceFor({ mood: "talking" }, fired, now).mouth, "talk", name);
  }
});

test("browRaise surprises, expectant lifts, glanceDown looks down", () => {
  let [fired, now] = at("browRaise");
  assert.equal(faceFor({ mood: "listening" }, fired, now).mouth, "round");
  [fired, now] = at("expectant", 0.5);
  const expectant = faceFor({ mood: "listening" }, fired, now);
  assert.equal(expectant.eyes, "wide");
  assert.ok(expectant.lift < -7);
  [fired, now] = at("glanceDown", 0.5);
  assert.equal(faceFor({ mood: "listening" }, fired, now).eyes, "down");
});

test("motion triggers move the body and settle back", () => {
  let [fired, now] = at("leanIn", 0.5);
  assert.ok(faceFor({ mood: "listening" }, fired, now).scaleX > 1.07);
  [fired, now] = at("handUp", 0.5);
  assert.ok(faceFor({ mood: "listening" }, fired, now).sun > 1.3);
  [fired, now] = at("nod", 0.25);
  assert.notEqual(faceFor({ mood: "listening" }, fired, now).lift, 0);
  const settled = faceFor({ mood: "listening" }, fired, triggerMs.nod + 1);
  assert.equal(settled.lift, 0);
  assert.equal(settled.scaleX, 1);
});

test("posture: soft for the opening, firm after sitUp", () => {
  assert.ok(faceFor({ mood: "intake" }, {}, 0, "soft").scaleY < 1);
  assert.ok(faceFor({ mood: "listening" }, {}, 0, "firm").scaleY > 1);
});
