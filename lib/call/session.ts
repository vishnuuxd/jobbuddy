import type { InterviewVM, Mood, Trigger } from "../avatar/interviewVM";

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
};

const questionsByMode = { full: 5, short: 3 } as const;
const phaseOrder: Phase[] = ["idle", "intake", "interview", "done"];
const initialState: CallState = { phase: "idle", setup: null, question: 0, speaking: false, reactions: [] };

export function totalQuestions(setup: Setup | null) {
  return setup ? questionsByMode[setup.mode] : null;
}

function moodFor({ phase, speaking }: CallState): Mood {
  if (speaking) return "talking";
  if (phase === "intake") return "intake";
  if (phase === "interview") return "listening";
  if (phase === "done") return "writing";
  return "idle";
}

export type CallSession = ReturnType<typeof createCallSession>;

// Tracks the call and turns it into InterviewVM values. No animation here.
export function createCallSession(vm: InterviewVM) {
  let state = initialState;
  let answeredSinceLastQuestion = false;
  const listeners = new Set<() => void>();

  function update(next: Partial<CallState>) {
    state = { ...state, ...next };
    vm.set({ mood: moodFor(state) });
    listeners.forEach((listener) => listener());
  }

  return {
    get: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    start() {
      answeredSinceLastQuestion = false;
      update({ ...initialState, phase: "intake" });
    },
    end() {
      answeredSinceLastQuestion = false;
      vm.set({ mouthOpen: 0 });
      update(initialState);
    },

    setSpeaking(speaking: boolean) {
      if (speaking !== state.speaking) update({ speaking });
    },
    noteUserMessage() {
      answeredSinceLastQuestion = true;
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
      update({ question: state.question + 1 });
      return true;
    },
  };
}
