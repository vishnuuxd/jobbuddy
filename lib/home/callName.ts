import type { Call, Setup } from "../store/types.ts";

// Call names from PRD.md, History: "Senior Product Designer 12".

/** Title case, keeping words already in capitals (UX, PM). */
export function titleCase(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => (/^[A-Z0-9]{2,}$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

const key = (setup: Pick<Setup, "role" | "seniority">) => `${setup.seniority.trim().toLowerCase()}|${setup.role.trim().toLowerCase()}`;

export function callName(setup: Pick<Setup, "role" | "seniority">, number: number) {
  return `${titleCase(`${setup.seniority} ${setup.role}`)} ${number}`;
}

/** The next number for this role and seniority. One past the highest so far, so a deleted call never frees its number. */
export function nextCallNumber(calls: Pick<Call, "setup" | "number">[], setup: Pick<Setup, "role" | "seniority">) {
  const same = calls.filter((call) => call.setup && key(call.setup) === key(setup));
  return Math.max(0, ...same.map((call) => call.number ?? 0)) + 1;
}

/** Numbers for calls saved before names existed: in date order, per role and seniority. */
export function numberCalls<T extends Pick<Call, "id" | "setup" | "startedAt" | "number">>(calls: T[]) {
  const counts = new Map<string, number>();
  const numbers = new Map<string, number>();
  for (const call of [...calls].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    if (!call.setup) continue;
    const next = (counts.get(key(call.setup)) ?? 0) + 1;
    counts.set(key(call.setup), next);
    numbers.set(call.id, next);
  }
  return numbers;
}
