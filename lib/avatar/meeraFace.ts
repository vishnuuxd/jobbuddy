import type { InterviewValues, Mood, Trigger } from "./interviewVM";

// How Meera's blob shows InterviewVM, per the Character section of PRD.md.
// Pure: given the values, when each trigger last fired and the time, it returns the face.

export type Eyes = "tall" | "flat" | "down" | "wide" | "worried";
export type Mouth = "none" | "smile" | "flat" | "wavy" | "round" | "talk";
export type Posture = "neutral" | "soft" | "firm";
export type Fired = Partial<Record<Trigger, number>>;

export type Face = {
  eyes: Eyes;
  mouth: Mouth;
  /** Dotted sun ring, shown while checkWatch runs. */
  ring: boolean;
  notepad: boolean;
  /** Up is negative, in px of a 240 px figure. */
  lift: number;
  scaleX: number;
  scaleY: number;
  /** Sun dot scale. */
  sun: number;
};

// How long each trigger shows, in ms. Animation timing, not a live rule threshold.
export const triggerMs: Record<Trigger, number> = {
  nod: 500,
  smile: 1200,
  browRaise: 600,
  glanceDown: 1700,
  handUp: 700,
  checkWatch: 1800,
  sitUp: 600,
  leanIn: 1700,
  expectant: 2500,
};

const moodFaces: Record<Mood, Pick<Face, "eyes" | "mouth" | "notepad">> = {
  idle: { eyes: "tall", mouth: "none", notepad: false },
  listening: { eyes: "tall", mouth: "none", notepad: false },
  intake: { eyes: "tall", mouth: "smile", notepad: false },
  talking: { eyes: "tall", mouth: "talk", notepad: false },
  skeptical: { eyes: "worried", mouth: "wavy", notepad: false },
  writing: { eyes: "down", mouth: "none", notepad: true },
  reading: { eyes: "down", mouth: "none", notepad: false },
};

const postureScale: Record<Posture, number> = { soft: 0.97, neutral: 1, firm: 1.02 };

// Rises, holds, falls. 0 to 1.
function held(ms: number, total: number, rise = 120, fall = 220) {
  return Math.max(0, Math.min(1, ms / rise, (total - ms) / fall));
}

function active(fired: Fired, name: Trigger, now: number) {
  const at = fired[name];
  if (at === undefined) return null;
  const ms = now - at;
  return ms >= 0 && ms <= triggerMs[name] ? ms : null;
}

export function faceFor(
  { mood }: Pick<InterviewValues, "mood">,
  fired: Fired,
  now: number,
  posture: Posture = "neutral",
): Face {
  const face: Face = { ...moodFaces[mood], ring: false, lift: 0, scaleX: 1, scaleY: postureScale[posture], sun: 1 };
  const talking = mood === "talking";

  // Expression triggers, weakest first so the strongest wins. Her voice keeps the talking mouth.
  const glance = active(fired, "glanceDown", now);
  if (glance !== null) face.eyes = "down";

  const smile = active(fired, "smile", now);
  if (smile !== null && !talking) face.mouth = "smile";

  const expectant = active(fired, "expectant", now);
  if (expectant !== null) {
    face.eyes = "wide";
    face.lift -= 8 * held(expectant, triggerMs.expectant, 200, 400);
  }

  const brow = active(fired, "browRaise", now);
  if (brow !== null) {
    face.eyes = "wide";
    if (!talking) face.mouth = "round";
  }

  const watch = active(fired, "checkWatch", now);
  if (watch !== null) {
    face.ring = true;
    face.eyes = "flat";
    if (!talking) face.mouth = "flat";
  }

  // Motion triggers.
  const nod = active(fired, "nod", now);
  if (nod !== null) {
    const p = nod / triggerMs.nod;
    face.lift += Math.sin(p * Math.PI * 2) * (1 - p) * 10;
  }

  const sitUp = active(fired, "sitUp", now);
  if (sitUp !== null) face.scaleY += Math.sin((sitUp / triggerMs.sitUp) * Math.PI) * 0.04;

  const lean = active(fired, "leanIn", now);
  if (lean !== null) {
    const amount = held(lean, triggerMs.leanIn, 250, 400) * 0.08;
    face.scaleX += amount;
    face.scaleY += amount;
  }

  const hand = active(fired, "handUp", now);
  if (hand !== null) {
    const amount = Math.sin((hand / triggerMs.handUp) * Math.PI);
    face.scaleX += amount * 0.06;
    face.scaleY -= amount * 0.06;
    face.sun += amount * 0.35;
  }

  return face;
}
