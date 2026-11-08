"use client";

import type { Setup } from "../store/types";

// Hands the sheet's setup to the call screen. Kept in memory for client-side
// navigation, with a sessionStorage copy so a reload of /call still has it.

export type PendingCall = {
  setup: Setup;
  cvText?: string;
  jdText?: string;
  /** Retry one question of an earlier call. */
  retry?: { callId: string; questionIndex: number; question: string; hint?: string };
  /** Pick up a dropped or cut short call. */
  resume?: { callId: string; question: number; lastQuestion?: string };
};

const key = "jobbuddy.pendingCall";
let pending: PendingCall | null = null;

export function setPendingCall(next: PendingCall) {
  pending = next;
  try {
    sessionStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Private mode: the in-memory copy is enough for client-side navigation.
  }
}

export function readPendingCall(): PendingCall | null {
  if (pending) return pending;
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? (JSON.parse(stored) as PendingCall) : null;
  } catch {
    return null;
  }
}

export function clearPendingCall() {
  pending = null;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
