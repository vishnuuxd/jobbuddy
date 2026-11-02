// InterviewVM from PRD.md. The app only sets these values. Whatever sits in the
// avatar slot, the orb now and the Rive rig later, only reads them.
export const moods = ["idle", "intake", "listening", "skeptical", "writing", "reading", "talking"] as const;
export const visemes = ["rest", "closed", "teeth", "open", "wide", "round", "pucker", "fv", "lth"] as const;
export const triggers = [
  "nod",
  "smile",
  "browRaise",
  "glanceDown",
  "handUp",
  "checkWatch",
  "sitUp",
  "leanIn",
  "expectant",
] as const;

export type Mood = (typeof moods)[number];
export type Viseme = (typeof visemes)[number];
export type Trigger = (typeof triggers)[number];
export type InterviewValues = { mood: Mood; viseme: Viseme; mouthOpen: number };

export type InterviewVM = {
  /** Current values. Safe to read every frame. */
  values: () => Readonly<InterviewValues>;
  set: (next: Partial<InterviewValues>) => void;
  /** Fires a trigger once. Returns false if the name isn't a trigger. */
  fire: (name: string) => boolean;
  onTrigger: (listener: (name: Trigger) => void) => () => void;
};

export function createInterviewVM(): InterviewVM {
  let current: InterviewValues = { mood: "idle", viseme: "rest", mouthOpen: 0 };
  const listeners = new Set<(name: Trigger) => void>();

  return {
    values: () => current,
    set(next) {
      current = { ...current, ...next };
      current.mouthOpen = Math.min(100, Math.max(0, current.mouthOpen));
    },
    fire(name) {
      if (!(triggers as readonly string[]).includes(name)) return false;
      listeners.forEach((listener) => listener(name as Trigger));
      return true;
    },
    onTrigger(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
