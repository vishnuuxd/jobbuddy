// Lip sync timing (PRD.md, Character and rig: Lip sync). These are mouth timings, not live
// reaction thresholds, so they live here rather than in lib/live/config.ts.
export const lipSyncConfig = {
  // Shapes shorter than this merge into a neighbour. Faster flickers read as noise.
  minShapeMs: 60,
  // Each shape shows this much before its sound, so the mouth leads the voice.
  leadMs: 40,
  // A gap between words shorter than this closes the lips. Longer, or at punctuation, is a pause: the mouth rests.
  pauseMs: 220,
};
