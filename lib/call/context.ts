import { midSentence } from "./opening.ts";
import { skills, type Setup, type Skill } from "../store/types.ts";

// What Meera gets as contextual updates. The rules for using them are in her
// system prompt (PRD.md, Agent spec): setup, focus skill, retry and resume.

export const maxContextWords = 4_000;

export function trimWords(text: string, max = maxContextWords) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length > max ? words.slice(0, max).join(" ") : text.trim();
}

export const isSkill = (value: unknown): value is Skill => skills.includes(value as Skill);

/** The setup at connect: who, what role, how long, what's attached, and the texts. */
export function setupUpdate(setup: Setup, texts: { cvText?: string; jdText?: string } = {}) {
  const lines = [
    "SETUP from the app.",
    `Name: ${setup.name?.trim() || "not given"}.`,
    `Role: ${midSentence(setup.seniority)} ${midSentence(setup.role)}.`,
    `Length: ${setup.durationMin} minutes, ${setup.questionCount} main questions.`,
    `CV: ${setup.hasCv ? "yes, below" : "none"}. Job post: ${setup.hasJd ? "yes, below" : "none"}.`,
  ];
  if (setup.focusSkill) lines.push(`FOCUS SKILL: ${setup.focusSkill}. Pick questions that test it.`);
  if (setup.hasCv && texts.cvText) lines.push("", "CV:", trimWords(texts.cvText));
  if (setup.hasJd && texts.jdText) lines.push("", "JOB POST:", trimWords(texts.jdText));
  return lines.join("\n");
}

export const oneMinuteLeftUpdate =
  "About a minute is left. Finish the current question and close. Don't start a new main question.";
