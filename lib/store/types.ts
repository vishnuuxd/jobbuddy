// The data model from PRD.md, Architecture: Data model.

export const skills = ["clarity", "structure", "evidence", "relevance", "delivery"] as const;
export type Skill = (typeof skills)[number];

export type Setup = {
  role: string;
  seniority: string;
  name?: string;
  durationMin: 5 | 10 | 20;
  questionCount: 2 | 3 | 5;
  focusSkill?: Skill;
  hasJd: boolean;
  hasCv: boolean;
};

export type TranscriptLine = {
  speaker: "user" | "agent";
  text: string;
  startSec: number;
  endSec: number;
  questionIndex?: number;
};
export type Flag = { type: string; quote: string; atSeconds: number; source: "client" | "agent" };
export type Metric = {
  questionIndex: number;
  seconds: number;
  wpm: number;
  fillers: number;
  hedges: number;
  words: number;
};

export const flagTypes = ["rambling", "off_question", "no_result", "filler", "hedging", "pace"] as const;
export type FlagType = (typeof flagTypes)[number];

export type ScoredAnswer = {
  questionIndex: number;
  question: string;
  lateAddition: boolean;
  scores: Record<Skill, number>;
  flagged?: { type: FlagType; quote: string; atSeconds: number; whyItMatters: string };
  rewrite?: { original: string; improved: string; whatChanged: string };
};

export type Scorecard = {
  summary: {
    strongest: { questionIndex: number; why: string };
    practiceNext: Skill;
    meeraTake: string;
    oneThing: { pattern: string; evidence: string; whyItMatters: string };
  };
  answers: ScoredAnswer[];
};

export type Retry = { questionIndex: number; at: string; answer: ScoredAnswer; transcript: TranscriptLine[] };

export type Call = {
  id: string;
  interviewerId: string;
  startedAt: string;
  endedAt?: string;
  setup?: Setup;
  jdText?: string;
  cvText?: string; // Snapshot used in this call
  transcript: TranscriptLine[];
  flags: Flag[];
  metrics: Metric[];
  lateAdditions: number[]; // Questions where a detail came after she moved on
  status: "completed" | "incomplete" | "scoring_failed";
  scorecard?: Scorecard;
  retries: Retry[];
};

export type SavedCv = { fileName: string; text: string; addedAt: string };

/** What the setup sheet remembers between calls. */
export type SheetChoices = { name?: string; role?: string; seniority?: string; durationMin?: 5 | 10 | 20 };

export type ProfileRow = { id: "me"; cv?: SavedCv; lastSetup?: SheetChoices; streakShownOn?: string };
