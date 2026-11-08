// When the app hangs up after Meera's closing line (PRD.md, Call behavior: Close).
// Never timed from setPhase("done"): that tool call can arrive before her audio does.

export type CloseState = {
  done: boolean; // setPhase("done") has fired
  speaking: boolean; // Her audio is playing now
  lastLineAt: number; // When her latest line's text arrived
  voiceStoppedAt: number; // When her audio last finished playing
  now: number;
};

export function readyToHangUp({ done, speaking, lastLineAt, voiceStoppedAt, now }: CloseState, quietMs: number) {
  if (!done || speaking) return false;
  // Her latest line must have been spoken: its audio ended after its text arrived.
  if (voiceStoppedAt === 0 || voiceStoppedAt < lastLineAt) return false;
  return now - voiceStoppedAt >= quietMs;
}
