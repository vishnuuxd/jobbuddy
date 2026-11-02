"use client";

import Dexie, { type EntityTable } from "dexie";
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
