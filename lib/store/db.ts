"use client";

import Dexie, { liveQuery, type EntityTable } from "dexie";
import { useEffect, useState } from "react";
import type { Call, SavedCv } from "./types";

type ProfileRow = { id: "me"; cv?: SavedCv };

const db = new Dexie("jobbuddy") as Dexie & {
  calls: EntityTable<Call, "id">;
  profile: EntityTable<ProfileRow, "id">;
};
db.version(1).stores({ calls: "id, startedAt", profile: "id" });

export const saveCall = (call: Call) => db.calls.put(call);
export const getSavedCv = async () => (await db.profile.get("me"))?.cv;
export const setSavedCv = (cv?: SavedCv) => db.profile.put({ id: "me", cv });

/** Every call, newest first. */
export const listCalls = (limit?: number) => {
  const query = db.calls.orderBy("startedAt").reverse();
  return (limit ? query.limit(limit) : query).toArray();
};

/** Calls that stay up to date as they're saved. Undefined while the first read is loading. */
export function useCalls(limit?: number) {
  const [calls, setCalls] = useState<Call[] | undefined>();
  useEffect(() => {
    const subscription = liveQuery(() => listCalls(limit)).subscribe({
      next: setCalls,
      error: () => setCalls([]),
    });
    return () => subscription.unsubscribe();
  }, [limit]);
  return calls;
}
