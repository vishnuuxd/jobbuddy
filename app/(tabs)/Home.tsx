"use client";

import { useEffect, useMemo, useState } from "react";
import { CallList } from "@/components/CallRow";
import { SetupSheet, type SheetStart } from "@/components/setup/SetupSheet";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Meera } from "@/components/meera/Meera";
import { Tag } from "@/components/ui/Chip";
import { FlameIcon } from "@/components/ui/icons";
import Link from "next/link";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { InterviewerPlaceholder } from "@/components/ui/InterviewerPlaceholder";
import { createInterviewVM } from "@/lib/avatar/interviewVM";
import { callTitle, greeting, streakDays } from "@/lib/home/format";
import { useCalls, useProfile } from "@/lib/store/db";
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
  const profile = useProfile();
  const streak = calls && now ? streakDays(calls, now) : 0;
  const recent = calls?.slice(0, 3);
  const [sheet, setSheet] = useState<SheetStart | null>(null);
  const closed = useMemo<SheetStart>(() => ({ kind: "new" }), []);

  // "From your last call": the latest scorecard's practiceNext skill.
  const lastScored = calls?.find((call) => call.status === "completed" && call.scorecard);
  const practice = lastScored?.scorecard
    ? { skill: lastScored.scorecard.summary.practiceNext, label: lastScored.scorecard.summary.oneThing.pattern }
    : null;
  const name = profile?.lastSetup?.name;

  // The scorecard's "Run this again" and "New interview" land here with ?sheet=.
  useEffect(() => {
    if (!calls) return;
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("sheet");
    if (!wanted) return;
    const from = calls.find((call) => call.id === params.get("id"));
    if (wanted === "again" && from?.setup) setSheet({ kind: "again", setup: from.setup, jdText: from.jdText });
    else setSheet({ kind: "new" });
    window.history.replaceState(null, "", "/");
  }, [calls]);

  const latest = recent?.[0];

  return (
    <main>
      <HeroHeader>
        <div className={styles.heroTop}>
          <HeroGreeting>{now ? `${greeting(now)}${name ? `, ${name}` : ""}` : "Hello"}</HeroGreeting>
          {streak > 0 && (
            <Tag icon={<FlameIcon />}>
              {streak} day streak
            </Tag>
          )}
        </div>
        <h1 className="t-hero">Ready for your next interview?</h1>

        <button
          type="button"
          className={styles.meeraCard}
          aria-label="Call Meera, HR screen, direct and fair"
          onClick={() => setSheet({ kind: "new" })}
        >
          <Meera vm={vm} size={64} />
          <span className={styles.meeraText}>
            <span className={styles.meeraName}>Meera</span>
            <span className={styles.meeraStyle}>HR screen · direct, fair</span>
          </span>
          <span className={styles.callPill} aria-hidden="true">
            Call
          </span>
        </button>

        <div className={styles.placeholders}>
          <InterviewerPlaceholder name="Arjun" />
          <InterviewerPlaceholder name="Lena" />
        </div>
      </HeroHeader>

      <div className={styles.content}>
        {practice && (
          <Card kind="lime">
            <Eyebrow>From your last call</Eyebrow>
            <p className="t-card">{practice.label}</p>
            <div className={styles.practiceRow}>
              <p className={styles.practiceMeta}>A 5 minute call, focused on this</p>
              <Button
                variant="ink"
                size="compact"
                onClick={() =>
                  setSheet({ kind: "focus", skill: practice.skill, label: practice.label, setup: lastScored?.setup })
                }
              >
                Practice this
              </Button>
            </div>
          </Card>
        )}

        <section className={styles.stackTight} aria-labelledby="recent-title">
          <div className={styles.sectionRow}>
            <h2 id="recent-title" className={styles.h2}>
              Recent calls
            </h2>
            {recent && recent.length > 0 && (
              <Link href="/history" className={styles.seeAll}>
                See all →
              </Link>
            )}
          </div>
          {!recent || !now ? (
            <div className={styles.loading} />
          ) : recent.length === 0 ? (
            <p className={styles.quiet}>Your calls show up here.</p>
          ) : (
            <>
              <CallList calls={recent} now={now} showScore />
              {latest?.setup && (
                <Button
                  variant="text"
                  className={styles.again}
                  onClick={() => setSheet({ kind: "again", setup: latest.setup!, jdText: latest.jdText })}
                >
                  Run {callTitle(latest)} again →
                </Button>
              )}
            </>
          )}
        </section>
      </div>

      <SetupSheet open={sheet !== null} start={sheet ?? closed} onClose={() => setSheet(null)} />
    </main>
  );
}
