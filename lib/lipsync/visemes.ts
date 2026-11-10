import type { Viseme } from "../avatar/interviewVM.ts";

// Letters to mouth shapes, from ElevenLabs character timing (PRD.md, Character and rig: Lip sync).
// Simple spelling rules, not phonemes: good enough for a cartoon mouth, and needs no dictionary.

export type Alignment = { chars: string[]; char_start_times_ms: number[]; char_durations_ms: number[] };
export type Shape = { viseme: Viseme; start: number; end: number };
type Timing = { minShapeMs: number; leadMs: number; pauseMs: number };

// Two letters that make one shape. Checked before single letters.
const pairs: Record<string, Viseme> = {
  th: "lth",
  sh: "teeth",
  ch: "teeth",
  ph: "fv",
  oo: "pucker",
  ou: "round",
  ee: "wide",
  ea: "wide",
  wh: "pucker",
};
const letters: Record<string, Viseme> = {
  m: "closed", b: "closed", p: "closed",
  f: "fv", v: "fv",
  l: "lth", t: "lth", d: "lth", n: "lth",
  a: "open",
  e: "wide", i: "wide", y: "wide",
  o: "round",
  u: "pucker", w: "pucker", q: "pucker",
  s: "teeth", z: "teeth", c: "teeth", x: "teeth", j: "teeth", k: "teeth", g: "teeth", r: "teeth", h: "teeth",
};
const isLetter = (c: string) => /\p{L}/u.test(c);
const isPause = (c: string) => /[.,!?;:…—–-]/.test(c);

/** One shape per letter (or letter pair), and one per gap: closed lips for a short gap, rest for a pause. */
export function lettersToShapes(alignment: Alignment, pauseMs: number): Shape[] {
  const { chars, char_start_times_ms: starts, char_durations_ms: durs } = alignment;
  const shapes: Shape[] = [];
  let i = 0;
  while (i < chars.length) {
    const start = starts[i];
    const c = chars[i].toLowerCase();
    if (isLetter(c)) {
      const pair = c + (chars[i + 1] ?? "").toLowerCase();
      if (pairs[pair] && i + 1 < chars.length) {
        shapes.push({ viseme: pairs[pair], start, end: starts[i + 1] + durs[i + 1] });
        i += 2;
      } else {
        shapes.push({ viseme: letters[c] ?? "open", start, end: start + durs[i] });
        i += 1;
      }
      continue;
    }
    // A run of spaces, punctuation and digits between words is one gap.
    let j = i;
    let pause = false;
    while (j < chars.length && !isLetter(chars[j])) {
      if (isPause(chars[j])) pause = true;
      j++;
    }
    const end = starts[j - 1] + durs[j - 1];
    shapes.push({ viseme: pause || end - start >= pauseMs ? "rest" : "closed", start, end });
    i = j;
  }
  return shapes;
}

/** Joins neighbours with the same shape, then folds any shape under minMs into the one before it. */
export function mergeShort(shapes: Shape[], minMs: number): Shape[] {
  const join = (list: Shape[]) =>
    list.reduce<Shape[]>((out, s) => {
      const last = out[out.length - 1];
      if (last && last.viseme === s.viseme) last.end = Math.max(last.end, s.end);
      else out.push({ ...s });
      return out;
    }, []);
  let out = join(shapes);
  for (let guard = 0; guard < 1000; guard++) {
    const k = out.findIndex((s) => s.end - s.start < minMs);
    if (k < 0 || out.length < 2) break;
    if (k > 0) out[k - 1].end = out[k].end;
    else out[1].start = out[0].start;
    out.splice(k, 1);
    out = join(out);
  }
  return out;
}

/** The full track for one chunk of audio: shapes, merged, each shown leadMs early. */
export function visemeTrack(alignment: Alignment, timing: Timing): Shape[] {
  if (!alignment.chars.length) return [];
  return mergeShort(lettersToShapes(alignment, timing.pauseMs), timing.minShapeMs).map((s) => ({
    ...s,
    start: s.start - timing.leadMs,
    end: s.end - timing.leadMs,
  }));
}

/** The shape at a time into the chunk. Rest before the first shape and after the last. */
export function visemeAt(track: Shape[], ms: number): Viseme {
  for (const s of track) if (ms >= s.start && ms < s.end) return s.viseme;
  return "rest";
}
