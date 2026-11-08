// Meera's first line, built from the setup sheet. The app speaks it through the
// first message override (PRD.md, Call behavior: Opening). Which line she says
// depends only on what was attached, so it's predictable rather than random.

export type OpeningSetup = {
  name?: string;
  role: string;
  seniority: string;
  durationMin: 5 | 10 | 20;
  hasCv: boolean;
  hasJd: boolean;
};

const minutes = { 5: "Five", 10: "Ten", 20: "Twenty" } as const;

// "Product designer" becomes "product designer", but "UX researcher" and "PM" keep their capitals.
function midSentence(text: string) {
  const trimmed = text.trim();
  return /^[A-Z][A-Z]/.test(trimmed) ? trimmed : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export function openingLine({ name, role, seniority, durationMin, hasCv, hasJd }: OpeningSetup) {
  const firstName = name?.trim();
  const hi = firstName ? `Hi ${firstName}, I'm Meera.` : "Hi, I'm Meera.";
  const length = minutes[durationMin];
  const job = `${midSentence(seniority)} ${midSentence(role)}`;

  if (hasCv && hasJd) return `${hi} ${length} minutes on the ${job} role. I've read your CV and the job post. Ready?`;
  if (hasCv) return `${hi} ${length} minute screen for the ${job} role. I've seen your CV. Ready?`;
  if (hasJd) return `${hi} ${length} minutes on the ${job} role. I've read the job post. Ready?`;
  return `${hi} ${length} minutes on the ${job} role today. Shall we start?`;
}
