import { trimWords } from "../call/context.ts";
import type { Call, TranscriptLine } from "../store/types.ts";

// The scorecard request from PRD.md, Scorecard: rubric, seniority bar and rewrite rules.

const rules = `You are writing the scorecard for a practice HR screening interview. The interviewer was Meera: direct, calm and fair. Write in plain words, like a person, not a report.

RUBRIC. Score each main answer 1 to 5 on five axes, judged against the seniority bar. A 3 is a passable answer at that level.
- clarity: 1 hard to follow what happened, 3 followable with effort, 5 clear on first listen.
- structure: 1 no situation, action or result, 3 two of the three, 5 all three, in order, result last.
- evidence: 1 no specifics, 3 some specifics, no numbers, 5 specific with a number or concrete outcome.
- relevance: 1 answers a different question, 3 mostly on the question, 5 directly answers it, nothing extra.
- delivery: 1 heavy filler, hedging or rambling, 3 some filler or one long stretch, 5 steady pace, little filler, no hedging. Use the delivery metrics given.

SENIORITY BAR. Junior: what they did and learned. Mid: what they owned and the outcome. Senior and above: scope, decisions, influence, tradeoffs.

REWRITE RULES.
- Use only facts from their answer and their CV. Never invent facts.
- Use the job description's language where it fits.
- Missing numbers become blanks: "[your number]". Never invent one.
- One rewrite per answer, for the weakest part, not the whole answer. "original" is their exact words.

FLAGS. For each answer, flag the single biggest problem: rambling, off_question, no_result, filler, hedging or pace. Quote their exact words, at most 25. Use the flags already logged during the call where they fit.

Never grade technical correctness. Judge how they answered, not whether they are right about their field.
lateAddition is true when a key detail came only after Meera had moved on: the question numbers in lateAdditions.`;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
const transcriptText = (lines: TranscriptLine[]) =>
  lines
    .map((line) => `[${clock(line.startSec)}]${line.questionIndex ? ` (Q${line.questionIndex})` : ""} ${line.speaker === "agent" ? "Meera" : "Candidate"}: ${line.text}`)
    .join("\n");

function context(call: Call) {
  const setup = call.setup;
  return [
    setup ? `ROLE: ${setup.seniority} ${setup.role}. Length: ${setup.durationMin} minutes, ${setup.questionCount} main questions.` : "",
    `DELIVERY METRICS (app measured, per question): ${JSON.stringify(call.metrics)}`,
    `FLAGS LOGGED DURING THE CALL: ${JSON.stringify(call.flags)}`,
    `LATE ADDITIONS (question numbers): ${JSON.stringify(call.lateAdditions)}`,
    call.cvText ? `CV:\n${trimWords(call.cvText)}` : "CV: none",
    call.jdText ? `JOB DESCRIPTION:\n${trimWords(call.jdText)}` : "JOB DESCRIPTION: none",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The prompt for a whole call. */
export function scorecardPrompt(call: Call) {
  return `${rules}

SUMMARY. meeraTake: one honest sentence in Meera's voice, warm but not flattering. oneThing: the main pattern across answers, with evidence like "2 of 3 answers stopped before the outcome." and one line on why it matters. strongest: the best answer and why, in one line. practiceNext: the one skill to practise next.
Score every main question that was answered. Ignore the opening small talk.

${context(call)}

TRANSCRIPT:
${transcriptText(call.transcript)}`;
}

/** The prompt for a retry of one question: score only the new answer. */
export function retryPrompt(call: Call, questionIndex: number, question: string, transcript: TranscriptLine[]) {
  return `${rules}

This is a RETRY of one question: "${question}" (question ${questionIndex}). Score only the new answer below, on the same rubric, with questionIndex ${questionIndex}.

${context({ ...call, metrics: call.metrics.filter((metric) => metric.questionIndex === questionIndex), flags: [] })}

NEW ANSWER TRANSCRIPT:
${transcriptText(transcript)}`;
}
