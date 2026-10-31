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
};
