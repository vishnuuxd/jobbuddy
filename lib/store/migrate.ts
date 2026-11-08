import type { Call, Setup } from "./types";

// v1 calls were set up by voice, with a mode instead of a length.
type V1Setup = { role: string; seniority: string; mode: "full" | "short"; hasJd: boolean; hasCv: boolean };

const lengths = { full: { durationMin: 20, questionCount: 5 }, short: { durationMin: 10, questionCount: 3 } } as const;

/** Turns a v1 voice-intake setup into the v2 shape. Leaves v2 setups alone. */
export function toSetup(setup: V1Setup | Setup | undefined | null): Setup | undefined {
  if (!setup) return undefined;
  if ("durationMin" in setup) return setup;
  const { mode, ...rest } = setup;
  return { ...rest, ...lengths[mode] };
}

/** Brings a stored call up to the current data model. */
export function upgradeCall(call: Call & { setup?: V1Setup | Setup }): Call {
  return {
    ...call,
    setup: toSetup(call.setup),
    lateAdditions: call.lateAdditions ?? [],
    retries: Array.isArray(call.retries) ? call.retries : [],
  };
}

export type { V1Setup };
