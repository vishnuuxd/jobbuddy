// The app owns the time limit (PRD.md, Call behavior: Interview). Counted from connect.
// Retry calls have none of this.

export type TimeLimitStep = { atMs: number; step: "nearlyUp" | "timeUp" | "endCall" };

/** When to warn her, when to tell her to close, and when to end the call if she hasn't. */
export function timeLimitSteps(durationMin: number, config: { nearlyUpMs: number; timeUpCloseCapMs: number }): TimeLimitStep[] {
  const lengthMs = durationMin * 60_000;
  return [
    { atMs: Math.max(0, lengthMs - config.nearlyUpMs), step: "nearlyUp" },
    { atMs: lengthMs, step: "timeUp" },
    { atMs: lengthMs + config.timeUpCloseCapMs, step: "endCall" },
  ];
}
