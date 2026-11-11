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
  // Safety net: she said her closing line on the last question but never called setPhase("done").
  // This long after her audio stops, the app closes the call itself, as complete.
  closingLineWaitMs: 3_000,
  // Ringing: the screen shows at least this long, even on a fast connection, so it never flashes.
  minRingMs: 1_200,
  // When she answers, the round avatar grows into the video call tile over this long.
  answerMs: 300,
};
