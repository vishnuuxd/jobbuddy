"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroMeta } from "@/components/ui/HeroHeader";
import { AttachError, extractText } from "@/lib/attach/extract";
import { completion } from "@/lib/home/format";
import { getSavedCv, setSavedCv, useCalls } from "@/lib/store/db";
import type { SavedCv } from "@/lib/store/types";
import styles from "../tabs.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// Simple for now: the full Profile (name, delete all data) is phase 6. CV handling is unchanged.
export function Profile() {
  const [cv, setCv] = useState<SavedCv | undefined | null>(null); // null while loading
  const [message, setMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const calls = useCalls();

  useEffect(() => {
    void getSavedCv().then(setCv);
  }, []);

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    try {
      const next = { fileName: file.name, text: await extractText(file), addedAt: new Date().toISOString() };
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

  const pick = () => fileInput.current?.click();

  return (
    <main>
      <HeroHeader>
        <h1 className="t-hero">Profile</h1>
        <HeroMeta>{calls ? completion(calls) : " "}</HeroMeta>
      </HeroHeader>

      <div className={styles.content}>
        <section className={styles.stackTight} aria-labelledby="cv-title">
          <h2 id="cv-title" className={styles.sectionHead}>
            Saved CV
          </h2>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={(event) => void onFileChosen(event.target.files?.[0])}
          />
          {cv === null ? (
            <div className={styles.loading} />
          ) : cv ? (
            <>
              <Card kind="hero" className={styles.cvCard}>
                <span className={styles.pdf} aria-hidden="true">
                  {/\.pdf$/i.test(cv.fileName) ? "PDF" : "TXT"}
                </span>
                <span>
                  <p className={styles.cvName}>{cv.fileName}</p>
                  <p className={styles.cvMeta}>Added {dateFormat.format(new Date(cv.addedAt))} · used in every call</p>
                </span>
              </Card>
              <div className={styles.pair}>
                <Button variant="quiet" size="small" onClick={pick}>
                  Replace
                </Button>
                <Button variant="quiet" size="small" className={styles.danger} onClick={() => void remove()}>
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.quiet}>No CV yet. Add one and Meera uses it in every call.</p>
              <Button variant="primary" size="small" block onClick={pick}>
                Upload a CV
              </Button>
            </>
          )}
          {message && (
            <p className={styles.alert} role="alert">
              {message}
            </p>
          )}
        </section>

        <Card kind="calm" className={styles.local}>
          <p className={styles.localTitle}>Everything stays on this phone</p>
          <p className={styles.cvMeta}>No account needed. Calls, scorecards and your CV live in this browser only.</p>
        </Card>
      </div>
    </main>
  );
}
