// Lip sync timing (PRD.md, Character and rig: Lip sync). These are mouth timings, not live
// reaction thresholds, so they live here rather than in lib/live/config.ts.
export const lipSyncConfig = {
  // Letters are grouped until each shape lasts at least this long. Faster flickers read as noise.
  minShapeMs: 60,
  // Each shape shows this much before its sound, so the mouth leads the voice.
  leadMs: 40,
  // A gap between words shorter than this closes the lips. Longer, or at punctuation, is a pause: the mouth rests.
  pauseMs: 220,
  // No shape holds longer than this while she speaks. Past it, the rig picks the mouth from mouthOpen.
  maxHoldMs: 250,
  // A gap between frames longer than this means playback timing can't be trusted: drop the
  // timeline and use mouthOpen until the next chunk starts it again.
  stallMs: 150,
};
