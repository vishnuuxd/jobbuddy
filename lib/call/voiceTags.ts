// Her text can carry voice tags like "[calm]" or "[laughs]". They're never shown in
// the caption, saved to the transcript or sent to the scorecard (PRD.md, Call behavior).

/**
 * A line with no words: ElevenLabs sends "..." for a turn she starts and I cut off before she
 * says anything. It's not something she said, so it never reaches the caption, the transcript or
 * the scorecard (it used to replace her question on the card).
 */
export function hasWords(text: string) {
  return /[\p{L}\p{N}]/u.test(text);
}

/** Removes every [square bracket] tag and tidies the spaces left behind. */
export function stripVoiceTags(text: string) {
  return text
    .replace(/\[[^\[\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[\s,;:]+/, "")
    .trim();
}
