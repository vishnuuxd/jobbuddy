// WCAG 2 contrast ratio between two hex colours.
function luminance(hex: string) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** AA: 4.5 for body text, 3 for large text (24 px, or 18.66 px bold). */
export function passes(ratio: number, large: boolean) {
  return ratio >= (large ? 3 : 4.5);
}
