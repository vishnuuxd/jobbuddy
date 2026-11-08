// When the app hangs up after Meera's closing line (PRD.md, Call behavior: Close).
// Normally: 1 second after her closing line has actually been heard, never timed
// from setPhase("done"), which can arrive before her audio does. Two safety caps,
// counted from setPhase("done"), stop a call staying open if her audio never comes
// or never ends.

export type CloseState = {
  doneAt: number; // When setPhase("done") fired. 0 if it hasn't
  speaking: boolean; // Her audio is playing now
  lastLineAt: number; // When her latest line's text arrived
  voiceStartedAt: number; // When her audio last started playing
  voiceStoppedAt: number; // When her audio last finished playing
  now: number;
};

export type Caps = { noAudioMs: number; unfinishedMs: number };

/** Why to hang up now, or null to keep waiting. */
export function hangUpReason(state: CloseState, quietMs: number, caps: Caps) {
  const { doneAt, speaking, lastLineAt, voiceStartedAt, voiceStoppedAt, now } = state;
  if (!doneAt) return null;

  // Her latest line has been spoken: its audio ended after its text arrived.
  const lineSpoken = voiceStoppedAt > 0 && voiceStoppedAt >= lastLineAt;
  if (!speaking && lineSpoken && now - voiceStoppedAt >= quietMs) return "spoken" as const;

  const waited = now - doneAt;
  const audioStarted = speaking || voiceStartedAt >= doneAt || lineSpoken;
  if (!audioStarted && waited >= caps.noAudioMs) return "noAudio" as const;
  if (waited >= caps.unfinishedMs) return "unfinished" as const;
  return null;
}
