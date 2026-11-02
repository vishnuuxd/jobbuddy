import type { CallSession } from "../call/session";
import { countFillers, countHedges, countWords, firstWords } from "./wordLists.ts";
import type { liveConfig } from "./config";

type Answer = {
  question: number;
  startedAt: number;
  lastSpeechAt: number;
  addition: boolean; // Talking again after she took her turn
  talking: boolean;
  expectantShown: boolean;
  glanced: boolean;
  checkedWatch: boolean;
  spokenInterruptions: number;
  restartSent: boolean;
  fillers: number;
  hedges: number;
  fillerRaised: boolean; // At most one browRaise per answer
  ramblingFlagged: boolean;
  text: string;
};

const quoteWords = 25;

const cutInUpdate =
  "The candidate's answer has run past 2 minutes. Cut in at the next pause with one short sentence.";
const restartUpdate =
  "The candidate has restarted their answer after you moved on. At the next pause let it run briefly, redirect once, and flag it as rambling.";

// Layer 1 from PRD.md. Timers and voice activity run live, and word rules run
// when each transcript arrives. Every number comes from config.
export function createLiveRules(
  session: CallSession,
  send: (text: string) => void,
  config: typeof liveConfig,
  clock: () => number = Date.now,
) {
  let answer: Answer | null = null;
  let lastAnswer: Answer | null = null; // Her transcript can land after she takes her turn.
  let onAnswerEnd = () => {};

  function open(addition: boolean, now: number, carried?: Answer | null) {
    answer = {
      question: session.get().question,
      startedAt: now,
      lastSpeechAt: now,
      addition,
      talking: true,
      expectantShown: false,
      glanced: false,
      checkedWatch: false,
      spokenInterruptions: 0,
      restartSent: false,
      fillers: 0,
      hedges: 0,
      fillerRaised: carried?.fillerRaised ?? false,
      ramblingFlagged: false,
      text: "",
    };
  }

  function close() {
    if (!answer) return;
    session.addMetric(answer.question, { seconds: (answer.lastSpeechAt - answer.startedAt) / 1000 });
    if (answer.addition) session.noteLateAddition(answer.question);
    lastAnswer = answer;
    answer = null;
    onAnswerEnd();
  }

  return {
    answering: () => answer !== null,
    setOnAnswerEnd(listener: () => void) {
      onAnswerEnd = listener;
    },

    vad(score: number) {
      const { phase, speaking, question } = session.get();
      if (phase !== "interview" || speaking || question === 0) return;
      if (score < config.vadSpeechThreshold) {
        if (answer) answer.talking = false;
        return;
      }
      const now = clock();
      if (!answer) {
        session.noteAnswerStarted();
        open(false, now);
      }
      answer!.talking = true;
      answer!.lastSpeechAt = now;
      answer!.expectantShown = false;
    },

    tick() {
      if (!answer || session.get().speaking) return;
      const now = clock();
      const elapsed = now - answer.startedAt;

      if (!answer.talking && !answer.expectantShown) {
        if (now - answer.lastSpeechAt >= config.expectantAfterSilenceMs) {
          answer.expectantShown = true;
          session.react("expectant");
        }
      }

      if (answer.addition) {
        if (elapsed >= config.additionMaxMs && !answer.restartSent) {
          answer.restartSent = true;
          send(restartUpdate);
        }
        return;
      }

      if (elapsed < config.quietStartMs) return;
      if (elapsed >= config.longAnswerGlanceDownMs && !answer.glanced) {
        answer.glanced = true;
        session.react("glanceDown");
      }
      if (elapsed >= config.longAnswerCheckWatchMs && !answer.checkedWatch) {
        answer.checkedWatch = true;
        session.react("checkWatch");
      }
      if (
        elapsed >= config.longAnswerCutInMs &&
        answer.spokenInterruptions < config.maxSpokenInterruptionsPerAnswer
      ) {
        answer.spokenInterruptions += 1;
        send(cutInUpdate);
      }
    },

    // She took her turn, so the answer is over.
    herTurn() {
      close();
    },

    // I started again while she was talking. Her question from that turn doesn't count.
    interruption() {
      const { phase, question } = session.get();
      if (phase !== "interview" || question === 0) return;
      const carried = answer ?? lastAnswer;
      close();
      session.dropQuestionFromThisTurn();
      open(true, clock(), carried);
    },

    userMessage(text: string) {
      const target = answer ?? lastAnswer;
      if (!target || session.get().phase !== "interview") return;

      const fillers = countFillers(text);
      const hedges = countHedges(text);
      target.fillers += fillers;
      target.hedges += hedges;
      target.text = `${target.text} ${text}`.trim();
      session.addMetric(target.question, { words: countWords(text), fillers, hedges });

      const quote = firstWords(text, quoteWords);
      const long = target.lastSpeechAt - target.startedAt >= config.quietStartMs;
      const fillerBurst = target.fillers >= config.fillerBurstCount;
      const hedgeBurst = target.hedges >= config.hedgeBurstCount;
      if (long && (fillerBurst || hedgeBurst) && !target.fillerRaised) {
        target.fillerRaised = true;
        session.react("browRaise");
        session.logFlag({ type: fillerBurst ? "filler" : "hedging", quote, source: "client" });
      }
      if (target.spokenInterruptions > 0 && !target.ramblingFlagged) {
        target.ramblingFlagged = true;
        session.logFlag({ type: "rambling", quote, source: "client" });
      }
    },

    finish() {
      close();
      lastAnswer = null;
    },
  };
}
