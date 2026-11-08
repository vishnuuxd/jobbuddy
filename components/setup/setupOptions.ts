import type { Skill } from "../../lib/store/types.ts";

// The sheet's choices, from PRD.md: Setup sheet.
export const roles = [
  "Product designer",
  "UX researcher",
  "Software engineer",
  "Product manager",
  "Data analyst",
  "Marketing",
  "Sales",
];
export const seniorities = ["Junior", "Mid", "Senior", "Lead"];

const questionCounts = { 5: 2, 10: 3, 20: 5 } as const;
export const questionsFor = (minutes: 5 | 10 | 20) => questionCounts[minutes];

const focusNames: Record<Skill, string> = {
  clarity: "being clear",
  structure: "landing results",
  evidence: "backing it up",
  relevance: "answering the question",
  delivery: "steady delivery",
};
export const focusTitle = (skill: Skill) => `A quick one on ${focusNames[skill]}`;

/** The sheet's heading follows what's chosen, so the night before reads differently. */
export function sheetTitle({ focus, hasJd, minutes }: { focus?: Skill; hasJd: boolean; minutes: number }) {
  if (focus) return { heading: focusTitle(focus), sticker: null };
  if (hasJd && minutes === 20) return { heading: "Full run with the real job post", sticker: "Job post added" };
  return { heading: "Let's get you interview ready", sticker: null };
}
