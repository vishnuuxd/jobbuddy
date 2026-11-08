"use client";

import Dexie, { liveQuery, type EntityTable } from "dexie";
import { useEffect, useState } from "react";
import { numberCalls } from "../home/callName";
import { upgradeCall } from "./migrate";
import type { Call, ProfileRow, SavedCv } from "./types";

const db = new Dexie("jobbuddy") as Dexie & {
  calls: EntityTable<Call, "id">;
  profile: EntityTable<ProfileRow, "id">;
};
db.version(1).stores({ calls: "id, startedAt", profile: "id" });
// v2: setups from the sheet (length and question count instead of a mode), scorecards and retries.
db.version(2)
  .stores({ calls: "id, startedAt", profile: "id" })
  .upgrade((tx) => tx.table("calls").toCollection().modify((call: Call) => Object.assign(call, upgradeCall(call))));
// v3: call names. Existing calls get numbers in date order, per role and seniority.
db.version(3)
  .stores({ calls: "id, startedAt", profile: "id" })
  .upgrade(async (tx) => {
    const calls = tx.table<Call, string>("calls");
    const numbers = numberCalls(await calls.toArray());
    await calls.toCollection().modify((call: Call) => {
      const number = numbers.get(call.id);
      if (number && !call.number) call.number = number;
    });
  });

export const saveCall = (call: Call) => db.calls.put(call);
export const getSavedCv = async () => (await db.profile.get("me"))?.cv;
export const getProfile = async (): Promise<ProfileRow> => (await db.profile.get("me")) ?? { id: "me" };
const updateProfile = async (change: Partial<ProfileRow>) => db.profile.put({ ...(await getProfile()), ...change });
export const setSavedCv = (cv?: SavedCv) => updateProfile({ cv });
export const saveProfile = updateProfile;
export const getCall = (id: string) => db.calls.get(id);
export const deleteCall = (id: string) => db.calls.delete(id);
export const deleteAllData = () => Promise.all([db.calls.clear(), db.profile.clear()]);

/** Every call, newest first. */
export const listCalls = (limit?: number) => {
  const query = db.calls.orderBy("startedAt").reverse();
  return (limit ? query.limit(limit) : query).toArray();
};

/** Calls that stay up to date as they're saved. Undefined while the first read is loading. */
/** One call that stays up to date. Undefined while loading, null if it doesn't exist. */
export function useCall(id: string | undefined) {
  const [call, setCall] = useState<Call | null | undefined>();
  useEffect(() => {
    if (!id) return;
    const subscription = liveQuery(() => db.calls.get(id)).subscribe({
      next: (found) => setCall(found ?? null),
      error: () => setCall(null),
    });
    return () => subscription.unsubscribe();
  }, [id]);
  return call;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | undefined>();
  useEffect(() => {
    const subscription = liveQuery(getProfile).subscribe({ next: setProfile, error: () => setProfile({ id: "me" }) });
    return () => subscription.unsubscribe();
  }, []);
  return profile;
}

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
