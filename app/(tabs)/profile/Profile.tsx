"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroMeta } from "@/components/ui/HeroHeader";
import { Sheet } from "@/components/ui/Sheet";
import { AttachError, extractText } from "@/lib/attach/extract";
import { completion, streakDays } from "@/lib/home/format";
import { deleteAllData, setSavedCv, useCalls, useProfile } from "@/lib/store/db";
import styles from "../tabs.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** Screen 4.4: who you are, your saved CV, and your data. */
export function Profile() {
  const profile = useProfile();
  const calls = useCalls();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => setNow(new Date()), []);

  const cv = profile?.cv;
  const name = profile?.lastSetup?.name?.trim();
  const streak = calls && now ? streakDays(calls, now) : 0;
  const meta = [streak > 0 ? `Day ${streak} streak` : null, calls ? completion(calls).replace(" interviews", "").replace(" interview", "") : null]
    .filter(Boolean)
    .join(" · ");

  async function onFileChosen(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    try {
      await setSavedCv({ fileName: file.name, text: await extractText(file), addedAt: new Date().toISOString() });
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof AttachError ? error.message : "I can't read that one. A PDF or plain text works.");
    }
  }

  const pick = () => fileInput.current?.click();

  return (
    <main>
      <HeroHeader>
        <div className={styles.profileHead}>
          <span className={styles.avatar} aria-hidden="true">
            {(name?.[0] ?? "Y").toUpperCase()}
          </span>
          <div>
            <h1 className="t-title">{name || "You"}</h1>
            <HeroMeta>{meta || " "}</HeroMeta>
          </div>
        </div>
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
          {profile === undefined ? (
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
                <Button variant="quiet" size="small" className={styles.danger} onClick={() => void setSavedCv(undefined)}>
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.quiet}>No CV yet. Add one and the setup sheet uses it for every call.</p>
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
          <Button variant="text" className={styles.deleteAll} onClick={() => setConfirming(true)}>
            Delete all data
          </Button>
        </Card>
      </div>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Delete everything?" showTitle>
        <div className={styles.stackTight}>
          <p className={styles.quiet}>Every call, scorecard and retry, your saved CV and your remembered setup. It can't be undone.</p>
          <Button
            variant="primary"
            block
            onClick={async () => {
              await deleteAllData();
              setConfirming(false);
            }}
          >
            Delete all data
          </Button>
          <Button variant="quiet" size="small" block onClick={() => setConfirming(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
