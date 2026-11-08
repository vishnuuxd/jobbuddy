// Call length timing. Not a live reaction, so it lives here, not in lib/live/config.ts.
export const callConfig = {
  // At this much time left, Meera is told to finish the current question and close.
  oneMinuteLeftMs: 60_000,
  // After setPhase("done"): hang up this long after her voice has actually stopped (PRD.md, Call behavior: Close).
  hangUpAfterHerVoiceMs: 1_000,
};
