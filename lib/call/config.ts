// Call length timing. Not a live reaction, so it lives here, not in lib/live/config.ts.
// The app owns the time limit (PRD.md, Call behavior: Interview).
export const callConfig = {
  // At this much time left, she's told not to start a new main question.
  nearlyUpMs: 120_000,
  // At the chosen length she's told to close now. If she still hasn't called
  // setPhase("done") this long after that, the app ends the call as complete.
  timeUpCloseCapMs: 60_000,
  // After setPhase("done"): hang up this long after her voice has actually stopped (PRD.md, Call behavior: Close).
  hangUpAfterHerVoiceMs: 1_000,
};
