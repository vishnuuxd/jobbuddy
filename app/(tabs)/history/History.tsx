"use client";

import { useEffect, useState } from "react";
import { CallList } from "@/components/CallRow";
import { Button } from "@/components/ui/Button";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { completion } from "@/lib/home/format";
import { useCalls } from "@/lib/store/db";
import styles from "../tabs.module.css";

// Simple for now: the full History (personal bests, badges, past calls) is phase 6.
export function History() {
  const calls = useCalls();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  return (
    <main>
      <HeroHeader>
        <h1 className="t-hero">History</h1>
        <HeroGreeting>{calls ? completion(calls) : " "}</HeroGreeting>
      </HeroHeader>

      <div className={styles.content}>
        {!calls || !now ? (
          <div className={styles.loading} />
        ) : calls.length === 0 ? (
          <>
            <p className={styles.quiet}>No interviews yet. Your first one takes five minutes.</p>
            <Button href="/" variant="secondary" size="small" block>
              Go to Home
            </Button>
          </>
        ) : (
          <section aria-labelledby="all-title">
            <h2 id="all-title" className={styles.sectionHead}>
              All calls
            </h2>
            <CallList calls={calls} now={now} />
          </section>
        )}
      </div>
    </main>
  );
}
