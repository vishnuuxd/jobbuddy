import type { InterviewVM, Mood, Trigger } from "../avatar/interviewVM";
import type { Call, Flag, Metric, TranscriptLine } from "../store/types";

export type Phase = "idle" | "intake" | "interview" | "done";
export type Setup = {
  role: string;
  seniority: string;
  mode: "full" | "short";
  hasJd: boolean;
  hasCv: boolean;
};
export type Reaction = { name: Trigger; at: number };
export type CallState = {
  phase: Phase;
  setup: Setup | null;
  /** The main question she's on, from 1. 0 before the first one. */
  question: number;
  speaking: boolean;
  reactions: Reaction[];
  held: "writing" | "reading" | null; // A mood that shows over everything for a moment
  id: string;
  startedAtMs: number;
  jdText?: string;
  cvText?: string;
  transcript: TranscriptLine[];
  flags: Flag[];
  metrics: Metric[];
  lateAdditions: number[];
};

const questionsByMode = { full: 5, short: 3 } as const;
const phaseOrder: Phase[] = ["idle", "intake", "interview", "done"];
const flagTypes = ["rambling", "off_question", "no_result", "filler", "hedging", "pace"];
const initialState: CallState = {
  phase: "idle",
  setup: null,
  question: 0,
  speaking: false,
  reactions: [],
  held: null,
  id: "",
  startedAtMs: 0,
  transcript: [],
  flags: [],
  metrics: [],
  lateAdditions: [],
};

export function totalQuestions(setup: Setup | null) {
  return setup ? questionsByMode[setup.mode] : null;
}

function moodFor({ phase, speaking, held }: CallState): Mood {
  if (held) return held; // Her voice still moves mouthOpen under a held mood.
  if (speaking) return "talking";
  if (phase === "intake") return "intake";
  if (phase === "interview") return "listening";
  if (phase === "done") return "writing";
  return "idle";
}

export function toCallRecord(state: CallState, endedAt?: string): Call {
  return {
    id: state.id,
    interviewerId: "meera",
    startedAt: new Date(state.startedAtMs).toISOString(),
    endedAt,
    setup: state.setup ?? undefined,
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
  config: { writingHoldMs: number; readingHoldMs: number },
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

  function hold(mood: "writing" | "reading", ms: number) {
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

    start(id: string) {
      answeredSinceLastQuestion = false;
      questionThisTurn = false;
      update({ ...initialState, phase: "intake", id, startedAtMs: clock() });
    },
    end() {
      answeredSinceLastQuestion = false;
      questionThisTurn = false;
      clearTimeout(holdTimer);
      vm.set({ mouthOpen: 0 });
      update(initialState);
    },

    setSpeaking(speaking: boolean) {
      if (speaking !== state.speaking) update({ speaking });
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

    attach(kind: "cv" | "jd", text: string) {
      update(kind === "cv" ? { cvText: text } : { jdText: text });
      hold("reading", config.readingHoldMs);
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
      const next = phaseOrder.indexOf(name as Phase);
      if (next < 1 || next < phaseOrder.indexOf(state.phase)) return false;
      update({ phase: name as Phase });
      return true;
    },

    setSetup(setup: Setup) {
      update({ setup });
    },

    // The app counts for itself, so her index is never used. A new main question
    // needs a new turn: without one, a repeat call in the same turn is dropped.
    // This gates on my reply, not on her words, because her message can arrive
    // before or after the tool call.
    nextQuestion() {
      if (state.phase !== "interview") return false;
      if (state.question > 0 && !answeredSinceLastQuestion) return false;
      const total = totalQuestions(state.setup);
      if (total !== null && state.question >= total) return false;
      answeredSinceLastQuestion = false;
      questionThisTurn = true;
      update({ question: state.question + 1 });
      return true;
    },

    // If I cut in on her turn, the label stays where it was.
    dropQuestionFromThisTurn() {
      if (!questionThisTurn) return;
      questionThisTurn = false;
      answeredSinceLastQuestion = true;
      update({ question: state.question - 1 });
    },
  };
}
