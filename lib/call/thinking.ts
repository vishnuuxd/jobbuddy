import type { CallState } from "./session.ts";

// Her reply is slow, so she shows she's thinking (PRD.md, Character and rig; rive/RIG.md).
// Armed when my turn ends (my final transcript arrives). If she hasn't started speaking
// thinkAfterMs after my voice stopped, the app fires think and holds the thinking mood until she
// speaks, or thinkHoldMs at most. A pause in the middle of an answer never fires it: ElevenLabs
// hasn't ended my turn, so there's no transcript yet.

type Session = {
  get: () => Pick<CallState, "speaking" | "phase" | "thinking">;
  react: (name: string) => boolean;
  setThinking: (thinking: boolean) => void;
};
type Config = { vadSpeechThreshold: number; thinkAfterMs: number; thinkHoldMs: number };

export function createThinkWatch(session: Session, config: Config, clock: () => number = () => Date.now()) {
  let lastSpeechAt = 0;
  let armed = false;
  let since = 0; // when think fired

  return {
    /** Voice activity from my mic. */
    vad(score: number) {
      if (score >= config.vadSpeechThreshold) lastSpeechAt = clock();
    },
    /** My turn has ended: my final transcript arrived. */
    userTurnEnded() {
      if (session.get().phase !== "interview" || session.get().speaking) return;
      armed = true;
      if (!lastSpeechAt) lastSpeechAt = clock();
    },
    /** She started speaking: thinking is over (the session clears its own flag). */
    herTurn() {
      armed = false;
      since = 0;
    },
    tick() {
      const now = clock();
      const { speaking, thinking, phase } = session.get();
      // Thinking belongs to the interview: the close (or a dropped call) ends it.
      if (phase !== "interview") {
        armed = false;
        if (thinking) session.setThinking(false);
        return;
      }
      if (thinking && (speaking || now - since >= config.thinkHoldMs)) {
        session.setThinking(false);
        since = 0;
      }
      if (!armed || speaking) return;
      if (now - lastSpeechAt >= config.thinkAfterMs) {
        armed = false;
        since = now;
        session.react("think");
        session.setThinking(true);
      }
    },
  };
}
