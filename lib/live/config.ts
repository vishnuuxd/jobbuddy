// Every live threshold lives here. Starting values from PRD.md, Layer 1.
// Turn eagerness, take turn after silence and end conversation after silence
// are agent settings, so they live in the ElevenLabs dashboard, not here.
export const liveConfig = {
  vadSpeechThreshold: 0.5,

  // Nothing fires this early in an answer.
  quietStartMs: 20_000,
  maxSpokenInterruptionsPerAnswer: 1,

  // Long answer ladder: glanceDown, checkWatch, then the contextual update.
  longAnswerGlanceDownMs: 75_000,
  longAnswerCheckWatchMs: 105_000,
  longAnswerCutInMs: 120_000,

  // Word rules, checked when an answer ends.
  fillerBurstCount: 6,
  hedgeBurstCount: 3,

  // Silence after I've been talking before the expectant look.
  expectantAfterSilenceMs: 1_500,

  // Talking after she has taken her turn: up to this long is an addition to
  // the previous answer, longer is a restart.
  additionMaxMs: 15_000,

  // Badges, worked out from each call (PRD.md, Scorecard: Gamification).
  badges: {
    noRambleMaxSeconds: 120, // No answer longer than this
    fillerFreeMaxPerAnswer: 3, // Fewer fillers than this in every answer
  },

  // How long the writing mood shows after a flag.
  writingHoldMs: 2_500,

  // Her voice volume (0 to 1) times this gives mouthOpen (0 to 100).
  mouthOpenGain: 250,

  // Safety caps after setPhase("done"), counted from that call. Normally the call
  // ends 1 s after her closing line has been heard (lib/call/config.ts). If her
  // audio hasn't started by noAudioMs, or hasn't finished by unfinishedMs, end anyway.
  endCallMaxWaitMs: {
    noAudioMs: 3_000,
    unfinishedMs: 15_000,
  },
};
