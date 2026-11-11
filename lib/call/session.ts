import type { InterviewVM, Mood, Trigger } from "../avatar/interviewVM";
import type { Call, Flag, Metric, Setup, TranscriptLine } from "../store/types";

export type { Setup };
export type Phase = "idle" | "opening" | "interview" | "done";
export type Reaction = { name: Trigger; at: number };
export type CallState = {
  phase: Phase;
  setup: Setup | null;
  /** The main question she's on, from 1. 0 before the first one. */
  question: number;
  speaking: boolean;
  /** Her reply is slow: the app fired think and holds the thinking mood until she speaks. */
  thinking: boolean;
  reactions: Reaction[];
  held: "writing" | null; // A mood that shows over everything for a moment
  id: string;
  startedAtMs: number;
  jdText?: string;
  cvText?: string;
  transcript: TranscriptLine[];
  flags: Flag[];
  metrics: Metric[];
  lateAdditions: number[];
  /** Saved when the call starts, for its name. Retries have none. */
  number?: number;
  /** A retry of one question: starts in the interview, and never moves past it. */
  retryOf: { callId: string; questionIndex: number } | null;
};

const phaseOrder: Phase[] = ["idle", "opening", "interview", "done"];
// The agent may still say "intake" for the opening.
const phaseNames: Record<string, Phase> = { opening: "opening", intake: "opening", interview: "interview", done: "done" };
const flagTypes = ["rambling", "off_question", "no_result", "filler", "hedging", "pace"];
const initialState: CallState = {
  phase: "idle",
  setup: null,
  question: 0,
  speaking: false,
  thinking: false,
  reactions: [],
  held: null,
  id: "",
  startedAtMs: 0,
  transcript: [],
  flags: [],
  metrics: [],
  lateAdditions: [],
  retryOf: null,
};

/** Main questions I've said something for. A scorecard needs two (PRD.md, Cut short). */
export function answeredQuestions(state: Pick<CallState, "transcript">) {
  return new Set(
    state.transcript.filter((line) => line.speaker === "user" && line.questionIndex).map((line) => line.questionIndex),
  ).size;
}

export function totalQuestions(setup: Setup | null) {
  return setup ? setup.questionCount : null;
}

function moodFor({ phase, speaking, thinking, held }: CallState): Mood {
  if (held) return held; // Her voice still moves mouthOpen under a held mood.
  if (speaking) return "talking";
  if (thinking && phase === "interview") return "thinking"; // Never over the close's writing mood.
  if (phase === "opening") return "intake"; // The intake mood name stays for the opening.
  if (phase === "interview") return "listening";
  if (phase === "done") return "writing";
  return "idle";
}

/**
 * Tags her current turn (every line since my last one) with a question. Her question's text can
 * arrive before or after nextQuestion, so the tag is set when the question changes, not only when
 * the line lands. A cut-in that takes the question back retags it back.
 */
export function retagHerTurn(transcript: TranscriptLine[], question: number): TranscriptLine[] {
  let lastMine = -1;
  transcript.forEach((line, i) => {
    if (line.speaker === "user") lastMine = i;
  });
  return transcript.map((line, i) => (i > lastMine && line.speaker === "agent" ? { ...line, questionIndex: question || undefined } : line));
}

export function toCallRecord(state: CallState, endedAt?: string): Call {
  return {
    id: state.id,
    interviewerId: "meera",
    startedAt: new Date(state.startedAtMs).toISOString(),
    endedAt,
    setup: state.setup ?? undefined,
    number: state.number,
    jdText: state.jdText,
    cvText: state.cvText,
    transcript: state.transcript,
    flags: state.flags,
    metrics: state.metrics,
    lateAdditions: state.lateAdditions,
    status: "incomplete", // The scorecard step sets the final status.
    retries: [],
  };
}

export type CallSession = ReturnType<typeof createCallSession>;

// Tracks the call and turns it into InterviewVM values. No animation here.
export function createCallSession(
  vm: InterviewVM,
  config: { writingHoldMs: number },
  clock: () => number = Date.now,
) {
  let state = initialState;
  let answeredSinceLastQuestion = false;
  let questionThisTurn = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  function update(next: Partial<CallState>) {
    state = { ...state, ...next };
    vm.set({ mood: moodFor(state) });
    listeners.forEach((listener) => listener());
  }

  function hold(mood: "writing", ms: number) {
    clearTimeout(holdTimer);
    update({ held: mood });
    holdTimer = setTimeout(() => update({ held: null }), ms);
  }

  const secondsIntoCall = () => (clock() - state.startedAtMs) / 1000;

  function logFlag({ type, quote, source }: Omit<Flag, "atSeconds">) {
    update({ flags: [...state.flags, { type, quote, source, atSeconds: secondsIntoCall() }] });
  }

  return {
    get: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** The setup comes from the sheet, so it's known before the call connects. */
    start(id: string, setup: Setup, texts: { cvText?: string; jdText?: string } = {}, number?: number) {
      answeredSinceLastQuestion = false;
      questionThisTurn = false;
      update({ ...initialState, phase: "opening", id, startedAtMs: clock(), setup, number, ...texts });
    },
    /** Retry one question: no opening, and the label stays on that question. */
    startRetry(
      id: string,
      setup: Setup,
      retry: { callId: string; questionIndex: number },
      texts: { cvText?: string; jdText?: string } = {},
    ) {
      answeredSinceLastQuestion = false;
      questionThisTurn = false;
      update({
        ...initialState,
        phase: "interview",
        id,
        startedAtMs: clock(),
        setup,
        ...texts,
        question: retry.questionIndex,
        retryOf: retry,
      });
    },
    /** Pick up a dropped or cut short call: same record, same question, no opening. */
    resume(call: Call) {
      answeredSinceLastQuestion = true;
      questionThisTurn = false;
      const question = Math.max(0, ...call.transcript.map((line) => line.questionIndex ?? 0));
      update({
        ...initialState,
        phase: question > 0 ? "interview" : "opening",
        id: call.id,
        startedAtMs: Date.parse(call.startedAt),
        setup: call.setup ?? null,
        number: call.number,
        cvText: call.cvText,
        jdText: call.jdText,
        transcript: call.transcript,
        flags: call.flags,
        metrics: call.metrics,
        lateAdditions: call.lateAdditions,
        question,
      });
    },
    end() {
      answeredSinceLastQuestion = false;
      questionThisTurn = false;
      clearTimeout(holdTimer);
      vm.set({ mouthOpen: 0 });
      update(initialState);
    },

    setSpeaking(speaking: boolean) {
      // She speaks: thinking is over.
      if (speaking !== state.speaking) update({ speaking, ...(speaking ? { thinking: false } : {}) });
    },
    setThinking(thinking: boolean) {
      if (thinking !== state.thinking) update({ thinking });
    },
    noteUserMessage() {
      answeredSinceLastQuestion = true;
    },
    // Set when I start answering, not when my transcript lands, because that can
    // come after she has started her next turn.
    noteAnswerStarted() {
      questionThisTurn = false;
    },

    addTranscript(speaker: TranscriptLine["speaker"], text: string, startMs: number) {
      const line: TranscriptLine = {
        speaker,
        text,
        startSec: (startMs - state.startedAtMs) / 1000,
        endSec: secondsIntoCall(),
        questionIndex: state.question || undefined,
      };
      update({ transcript: [...state.transcript, line] });
    },


    setCvText(cvText: string) {
      update({ cvText });
    },

    addMetric(
      questionIndex: number,
      added: Partial<Pick<Metric, "seconds" | "words" | "fillers" | "hedges">>,
    ) {
      const old = state.metrics.find((metric) => metric.questionIndex === questionIndex);
      const seconds = (old?.seconds ?? 0) + (added.seconds ?? 0);
      const words = (old?.words ?? 0) + (added.words ?? 0);
      const metric: Metric = {
        questionIndex,
        seconds,
        words,
        fillers: (old?.fillers ?? 0) + (added.fillers ?? 0),
        hedges: (old?.hedges ?? 0) + (added.hedges ?? 0),
        wpm: seconds > 0 ? Math.round((words / seconds) * 60) : 0,
      };
      const others = state.metrics.filter((item) => item.questionIndex !== questionIndex);
      update({ metrics: [...others, metric] });
    },

    noteLateAddition(questionIndex: number) {
      if (state.lateAdditions.includes(questionIndex)) return;
      update({ lateAdditions: [...state.lateAdditions, questionIndex] });
    },

    logFlag,

    // Ignored outside the interview. The agent's quote is at most 25 words by its own rules.
    flag(type: string, quote: string) {
      if (state.phase !== "interview" || !flagTypes.includes(type)) return false;
      logFlag({ type, quote, source: "agent" });
      hold("writing", config.writingHoldMs);
      return true;
    },

    react(name: string) {
      if (!vm.fire(name)) return false;
      update({ reactions: [...state.reactions, { name: name as Trigger, at: Date.now() }] });
      return true;
    },

    // The phase only moves forward. Nothing before a call can be set by the agent.
    setPhase(name: string) {
      const phase = phaseNames[name];
      if (!phase || phaseOrder.indexOf(phase) < phaseOrder.indexOf(state.phase)) return false;
      update({ phase });
      return true;
    },



    // The app counts for itself, so her index is never used. A new main question
    // needs a new turn: without one, a repeat call in the same turn is dropped.
    // This gates on my reply, not on her words, because her message can arrive
    // before or after the tool call.
    nextQuestion() {
      if (state.phase !== "interview" || state.retryOf) return false;
      if (state.question > 0 && !answeredSinceLastQuestion) return false;
      const total = totalQuestions(state.setup);
      if (total !== null && state.question >= total) return false;
      answeredSinceLastQuestion = false;
      questionThisTurn = true;
      update({ question: state.question + 1, transcript: retagHerTurn(state.transcript, state.question + 1) });
      return true;
    },

    // If I cut in on her turn, the label stays where it was.
    dropQuestionFromThisTurn() {
      if (!questionThisTurn) return;
      questionThisTurn = false;
      answeredSinceLastQuestion = true;
      update({ question: state.question - 1, transcript: retagHerTurn(state.transcript, state.question - 1) });
    },
  };
}
