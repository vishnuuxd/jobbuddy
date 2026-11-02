// Word lists for the filler and hedge rules. Thresholds live in config.ts.
// "like" is left out: it's too often a real word to count fairly.
const fillers = ["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "you know", "i mean"];
const hedges = [
  "maybe",
  "perhaps",
  "probably",
  "i think",
  "i guess",
  "i feel like",
  "sort of",
  "kind of",
  "not sure",
  "might be",
];

const matcher = (list: string[]) => new RegExp(`\\b(?:${list.join("|")})\\b`, "gi");
const fillerMatcher = matcher(fillers);
const hedgeMatcher = matcher(hedges);

export const countFillers = (text: string) => text.match(fillerMatcher)?.length ?? 0;
export const countHedges = (text: string) => text.match(hedgeMatcher)?.length ?? 0;
export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export const firstWords = (text: string, count: number) =>
  text.trim().split(/\s+/).slice(0, count).join(" ");
