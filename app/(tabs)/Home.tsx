"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CallList } from "@/components/CallRow";
import { Meera } from "@/components/meera/Meera";
import { Sticker } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { InterviewerPlaceholder } from "@/components/ui/InterviewerPlaceholder";
import { createInterviewVM } from "@/lib/avatar/interviewVM";
import { greeting, streakDays } from "@/lib/home/format";
import { useCalls } from "@/lib/store/db";
import styles from "./tabs.module.css";

/** The time, set after mount so server and browser render the same HTML. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

export function Home() {
  const [vm] = useState(createInterviewVM); // Idle: she just breathes.
  const calls = useCalls();
  const now = useNow();
  const streak = calls && now ? streakDays(calls, now) : 0;
  const recent = calls?.slice(0, 3);

  return (
    <main>
      <HeroHeader>
        <div className={styles.heroTop}>
          <HeroGreeting>{now ? greeting(now) : "Hello"}</HeroGreeting>
          {streak > 0 && <Sticker tilt={3}>Day {streak} streak</Sticker>}
        </div>
        <h1 className="t-hero">Who are you practising with?</h1>
      </HeroHeader>

      <div className={styles.content}>
        {/* Goes straight to the call until the setup sheet arrives in phase 3. */}
        <Link href="/call" className={styles.meeraCard} aria-label="Call Meera, HR screen, direct and fair. Taking calls.">
          <Meera vm={vm} size={92} />
          <span className={styles.meeraText}>
            <span className={styles.meeraName}>Meera</span>
            <span className={styles.meeraStyle}>HR screen · direct, fair</span>
            <span className={styles.live}>
              <span className={styles.dot} /> Taking calls
            </span>
          </span>
        </Link>

        <div className={styles.placeholders}>
          <InterviewerPlaceholder name="Arjun" />
          <InterviewerPlaceholder name="Lena" variant={1} />
        </div>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className={styles.sectionHead}>
            Recent calls
          </h2>
          {!recent || !now ? (
            <div className={styles.loading} />
          ) : recent.length === 0 ? (
            <p className={styles.quiet}>Your calls show up here.</p>
          ) : (
            <CallList calls={recent} now={now} />
          )}
        </section>
      </div>
    </main>
  );
}
