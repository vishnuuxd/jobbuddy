import type { Setup } from "../call/session";

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
export type Call = {
  id: string;
  interviewerId: string;
  startedAt: string;
  endedAt?: string;
  setup?: Setup;
  jdText?: string;
  cvText?: string;
  transcript: TranscriptLine[];
  flags: Flag[];
  metrics: Metric[];
  lateAdditions: number[]; // Questions where a detail came after she moved on
  status: "completed" | "incomplete" | "scoring_failed";
  retries: unknown[];
};
export type SavedCv = { fileName: string; text: string; addedAt: string };
