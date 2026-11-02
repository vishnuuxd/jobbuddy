"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AttachError, extractText } from "@/lib/attach/extract";
import { getSavedCv, setSavedCv } from "@/lib/store/db";
import type { SavedCv } from "@/lib/store/types";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function Profile() {
  const [cv, setCv] = useState<SavedCv | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getSavedCv().then(setCv);
  }, []);

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    try {
      const next = {
        fileName: file.name,
        text: await extractText(file),
        addedAt: new Date().toISOString(),
      };
      await setSavedCv(next);
      setCv(next);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof AttachError ? error.message : "I can't read that one.");
    }
  }

  async function remove() {
    await setSavedCv(undefined);
    setCv(undefined);
  }

  return (
    <main className="profile">
      <Link href="/call">Back</Link>
      <h1>Profile</h1>
      <h2>Saved CV</h2>
      <p>
        {cv
          ? `${cv.fileName}, added ${dateFormat.format(new Date(cv.addedAt))}`
          : "None yet. Meera will ask for one on each call."}
      </p>
      {message && <p role="alert">{message}</p>}
      <input
        ref={fileInput}
        type="file"
        hidden
        accept=".pdf,.txt,.md,application/pdf,text/plain"
        onChange={(event) => void onFileChosen(event.target.files?.[0])}
      />
      <div className="row">
        <button onClick={() => fileInput.current?.click()}>{cv ? "Replace" : "Upload"}</button>
        {cv && (
          <button className="quiet" onClick={() => void remove()}>
            Delete
          </button>
        )}
      </div>
    </main>
  );
}
