// Her text can carry voice tags like "[calm]" or "[laughs]". They're never shown in
// the caption, saved to the transcript or sent to the scorecard (PRD.md, Call behavior).

/** Removes every [square bracket] tag and tidies the spaces left behind. */
export function stripVoiceTags(text: string) {
  return text
    .replace(/\[[^\[\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[\s,;:]+/, "")
    .trim();
}
