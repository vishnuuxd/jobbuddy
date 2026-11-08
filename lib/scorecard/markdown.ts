import { callMeta, callTitle } from "../home/format.ts";
import { callSkillScores, momentsFor, skillNames } from "../progress/score.ts";
import { skills, type Call } from "../store/types.ts";

/** The scorecard as a Markdown file, for "Save as Markdown". */
export function scorecardMarkdown(call: Call, now: Date) {
  const card = call.scorecard;
  if (!card) return `# ${callTitle(call)}\n\nNo scorecard yet.\n`;
  const scores = callSkillScores(call)!;
  const lines = [
    `# ${callTitle(call)}`,
    `${callMeta(call, now)}`,
    "",
    `> ${card.summary.meeraTake}`,
    "",
    `## Your one thing: ${card.summary.oneThing.pattern}`,
    `${card.summary.oneThing.evidence} ${card.summary.oneThing.whyItMatters}`.trim(),
    "",
    "## Moments to fix",
  ];
  for (const moment of momentsFor(card)) {
    lines.push("", `### Question ${moment.questionIndex} · ${moment.question}`);
    if (moment.rewrite) {
      lines.push(`- You said: "${moment.rewrite.original}"`, `- Try this: "${moment.rewrite.improved}"`, `- What changed: ${moment.rewrite.whatChanged}`);
    }
    if (moment.flagged?.whyItMatters) lines.push(`- Why: ${moment.flagged.whyItMatters}`);
  }
  lines.push("", "## What went well", card.summary.strongest.why, "", "## Skills");
  for (const skill of skills) lines.push(`- ${skillNames[skill]}: ${scores[skill]} of 5`);
  return `${lines.join("\n")}\n`;
}
