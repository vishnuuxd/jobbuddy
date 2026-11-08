import { flagTypes, skills, type FlagType, type ScoredAnswer, type Scorecard, type Skill } from "../store/types.ts";

// The scorecard JSON schema from PRD.md, as JSON Schema for Gemini's structured output.

const score = { type: "integer", minimum: 1, maximum: 5 };
const answerSchema = {
  type: "object",
  properties: {
    questionIndex: { type: "integer" },
    question: { type: "string", description: "The main question, short, like 'Stakeholder pushback'" },
    lateAddition: { type: "boolean", description: "True if a key detail came only after she had moved on" },
    scores: { type: "object", properties: Object.fromEntries(skills.map((skill) => [skill, score])), required: [...skills] },
    flagged: {
      type: "object",
      properties: {
        type: { type: "string", enum: [...flagTypes] },
        quote: { type: "string", description: "My exact words, at most 25" },
        atSeconds: { type: "number" },
        whyItMatters: { type: "string", description: "One line" },
      },
      required: ["type", "quote", "atSeconds", "whyItMatters"],
    },
    rewrite: {
      type: "object",
      properties: {
        original: { type: "string", description: "My exact words" },
        improved: { type: "string" },
        whatChanged: { type: "string", description: "One line" },
      },
      required: ["original", "improved", "whatChanged"],
    },
  },
  required: ["questionIndex", "question", "lateAddition", "scores", "flagged", "rewrite"],
};

export const scorecardSchema = {
  type: "object",
  properties: {
    summary: {
      type: "object",
      properties: {
        strongest: { type: "object", properties: { questionIndex: { type: "integer" }, why: { type: "string" } }, required: ["questionIndex", "why"] },
        practiceNext: { type: "string", enum: [...skills] },
        meeraTake: { type: "string", description: "One honest sentence in Meera's voice" },
        oneThing: {
          type: "object",
          properties: {
            pattern: { type: "string", description: "Short, like 'End with the result'" },
            evidence: { type: "string", description: "Like '2 of 3 answers stopped before the outcome.'" },
            whyItMatters: { type: "string", description: "One line" },
          },
          required: ["pattern", "evidence", "whyItMatters"],
        },
      },
      required: ["strongest", "practiceNext", "meeraTake", "oneThing"],
    },
    answers: { type: "array", items: answerSchema },
  },
  required: ["summary", "answers"],
};

export const retrySchema = answerSchema;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const clampScore = (value: unknown) => Math.min(5, Math.max(1, Math.round(Number(value))));

/** Checks one answer from the model. Returns null if it can't be used. */
export function validateAnswer(value: unknown): ScoredAnswer | null {
  if (!isObject(value) || !isObject(value.scores)) return null;
  const scores = {} as Record<Skill, number>;
  for (const skill of skills) {
    const raw = Number(value.scores[skill]);
    if (!Number.isFinite(raw)) return null;
    scores[skill] = clampScore(raw);
  }
  const answer: ScoredAnswer = {
    questionIndex: Number(value.questionIndex) || 0,
    question: text(value.question),
    lateAddition: value.lateAddition === true,
    scores,
  };
  const flagged = value.flagged;
  if (isObject(flagged) && flagTypes.includes(flagged.type as FlagType) && text(flagged.quote)) {
    answer.flagged = {
      type: flagged.type as FlagType,
      quote: text(flagged.quote),
      atSeconds: Number(flagged.atSeconds) || 0,
      whyItMatters: text(flagged.whyItMatters),
    };
  }
  const rewrite = value.rewrite;
  if (isObject(rewrite) && text(rewrite.improved)) {
    answer.rewrite = { original: text(rewrite.original), improved: text(rewrite.improved), whatChanged: text(rewrite.whatChanged) };
  }
  return answer;
}

/** Checks a whole scorecard from the model. Returns null if it can't be used. */
export function validateScorecard(value: unknown): Scorecard | null {
  if (!isObject(value) || !isObject(value.summary) || !Array.isArray(value.answers)) return null;
  const { summary } = value;
  const strongest = isObject(summary.strongest) ? summary.strongest : {};
  const oneThing = isObject(summary.oneThing) ? summary.oneThing : {};
  if (!skills.includes(summary.practiceNext as Skill) || !text(summary.meeraTake) || !text(oneThing.pattern)) return null;
  const answers = value.answers.map(validateAnswer).filter((answer): answer is ScoredAnswer => answer !== null);
  if (answers.length === 0) return null;
  return {
    summary: {
      strongest: { questionIndex: Number(strongest.questionIndex) || answers[0].questionIndex, why: text(strongest.why) },
      practiceNext: summary.practiceNext as Skill,
      meeraTake: text(summary.meeraTake),
      oneThing: { pattern: text(oneThing.pattern), evidence: text(oneThing.evidence), whyItMatters: text(oneThing.whyItMatters) },
    },
    answers: answers.sort((a, b) => a.questionIndex - b.questionIndex),
  };
}
