import type { Call, FlagType, TranscriptLine } from "../store/types.ts";

// The transcript tab (screen 4.3): each line, with flagged moments highlighted.

export type TranscriptItem = TranscriptLine & {
  flag?: { type: FlagType | string; source: "client" | "agent" };
};

const normal = (text: string) => text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Puts each flag on the line it quotes, or on my nearest line in time. One flag per line. */
export function transcriptItems(call: Pick<Call, "transcript" | "flags" | "scorecard">): TranscriptItem[] {
  const items: TranscriptItem[] = call.transcript.map((line) => ({ ...line }));
  const flags = [
    ...call.flags.map((flag) => ({ type: flag.type, quote: flag.quote, atSeconds: flag.atSeconds, source: flag.source })),
    ...(call.scorecard?.answers ?? [])
      .filter((answer) => answer.flagged)
      .map((answer) => ({ ...answer.flagged!, source: "agent" as const })),
  ];
  for (const flag of flags) {
    const quote = normal(flag.quote).slice(0, 40);
    let index = quote ? items.findIndex((item) => item.speaker === "user" && !item.flag && normal(item.text).includes(quote)) : -1;
    if (index < 0) {
      let nearest = Infinity;
      items.forEach((item, i) => {
        const distance = Math.abs(item.startSec - flag.atSeconds);
        if (item.speaker === "user" && !item.flag && distance < nearest && distance <= 30) {
          nearest = distance;
          index = i;
        }
      });
    }
    if (index >= 0) items[index].flag = { type: flag.type, source: flag.source };
  }
  return items;
}

export const flagNames: Record<string, string> = {
  rambling: "Rambling",
  off_question: "Off the question",
  no_result: "No result",
  filler: "Fillers",
  hedging: "Hedging",
  pace: "Pace",
};
