import type { Viseme } from "../avatar/interviewVM.ts";

// Letters to mouth shapes, from ElevenLabs character timing (PRD.md, Character and rig: Lip sync).
// Simple spelling rules, not phonemes: good enough for a cartoon mouth, and needs no dictionary.

export type Alignment = { chars: string[]; char_start_times_ms: number[]; char_durations_ms: number[] };
/** gap: the space between words, not a letter. */
export type Shape = { viseme: Viseme; start: number; end: number; gap?: boolean };
type Timing = { minShapeMs: number; leadMs: number; pauseMs: number };
export type ShapeAt = { viseme: Viseme; start: number; end: number } | null;

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
  l: "lth", n: "lth",
  d: "teeth", t: "teeth",
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
    shapes.push({ viseme: pause || end - start >= pauseMs ? "rest" : "closed", start, end, gap: true });
    i = j;
  }
  return shapes;
}

/**
 * Groups neighbouring shapes until each group lasts at least minMs, and shows its most visible
 * letter: vowels first, then closed lips, then the rest (see `visibility`), the longer one on a
 * tie. A word gap only shows when the group has no letter, so gaps don't
 * swallow the quick letters around them. A group closes as soon as it is long enough, so letters
 * never pile onto one shape: the old fold-into-the-previous merge let a whole word collapse into
 * its first shape. Neighbours with the same shape are joined.
 */
// Which letter a group shows: a cartoon mouth reads by its vowels and its lip closures.
const visibility: Record<Viseme, number> = { open: 8, wide: 7, round: 6, pucker: 5, closed: 4, fv: 3, lth: 2, teeth: 1, rest: 0 };

export function mergeShort(shapes: Shape[], minMs: number): Shape[] {
  const groups: Shape[] = [];
  let group: Shape[] = [];
  const close = () => {
    if (!group.length) return;
    const letters = group.filter((s) => !s.gap);
    const pool = letters.length ? letters : group;
    const shown = pool.reduce((a, b) => {
      const va = visibility[a.viseme], vb = visibility[b.viseme];
      return vb > va || (vb === va && b.end - b.start > a.end - a.start) ? b : a;
    });
    groups.push({ viseme: shown.viseme, start: group[0].start, end: group[group.length - 1].end, ...(letters.length ? {} : { gap: true }) });
    group = [];
  };
  for (const s of shapes) {
    group.push(s);
    if (group[group.length - 1].end - group[0].start >= minMs) close();
  }
  // A short tail joins the group before it.
  if (group.length) {
    if (groups.length) groups[groups.length - 1].end = group[group.length - 1].end;
    else close();
  }
  return groups.reduce<Shape[]>((out, s) => {
    const last = out[out.length - 1];
    if (last && last.viseme === s.viseme && last.end >= s.start) last.end = s.end;
    else out.push({ viseme: s.viseme, start: s.start, end: s.end });
    return out;
  }, []);
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

/** The shape at a time into the chunk, or null before the first shape and after the last. */
export function shapeAt(track: Shape[], ms: number): ShapeAt {
  for (const s of track) if (ms >= s.start && ms < s.end) return s;
  return null;
}

/** The viseme at a time into the chunk. Rest before the first shape and after the last. */
export function visemeAt(track: Shape[], ms: number): Viseme {
  return shapeAt(track, ms)?.viseme ?? "rest";
}
