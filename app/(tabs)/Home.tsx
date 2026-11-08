"use client";

import { useEffect, useMemo, useState } from "react";
import { CallList } from "@/components/CallRow";
import { SetupSheet, type SheetStart } from "@/components/setup/SetupSheet";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Meera } from "@/components/meera/Meera";
import { Sticker } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { InterviewerPlaceholder } from "@/components/ui/InterviewerPlaceholder";
import { createInterviewVM } from "@/lib/avatar/interviewVM";
import { greeting, streakDays } from "@/lib/home/format";
import { skillNames } from "@/lib/progress/score";
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

  return (
    <main>
      <HeroHeader>
        <div className={styles.heroTop}>
          <HeroGreeting>{now ? `${greeting(now)}${name ? `, ${name}` : ""}` : "Hello"}</HeroGreeting>
          {streak > 0 && <Sticker tilt={3}>Day {streak} streak</Sticker>}
        </div>
        <h1 className="t-hero">Who are you practising with?</h1>
      </HeroHeader>

      <div className={styles.content}>
        <button
          type="button"
          className={styles.meeraCard}
          aria-label="Call Meera, HR screen, direct and fair. Taking calls."
          onClick={() => setSheet({ kind: "new" })}
        >
          <Meera vm={vm} size={92} />
          <span className={styles.meeraText}>
            <span className={styles.meeraName}>Meera</span>
            <span className={styles.meeraStyle}>HR screen · direct, fair</span>
            <span className={styles.live}>
              <span className={styles.dot} /> Taking calls
            </span>
          </span>
        </button>

        <div className={styles.placeholders}>
          <InterviewerPlaceholder name="Arjun" />
          <InterviewerPlaceholder name="Lena" variant={1} />
        </div>

        {practice && (
          <Card kind="cream" outlined>
            <Eyebrow>From your last call</Eyebrow>
            <div className={styles.practiceRow}>
              <div className={styles.practiceText}>
                <p className="t-card">{practice.label}</p>
                <p className={styles.practiceMeta}>5 min call on {skillNames[practice.skill].toLowerCase()}</p>
              </div>
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

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className={styles.sectionHead}>
            Recent calls
          </h2>
          {!recent || !now ? (
            <div className={styles.loading} />
          ) : recent.length === 0 ? (
            <p className={styles.quiet}>Your calls show up here.</p>
          ) : (
            <CallList
              calls={recent}
              now={now}
              actionFor={(call, index) =>
                index === 0 && call.setup ? (
                  <Button
                    variant="text"
                    className={styles.again}
                    aria-label={`Run this again: ${call.setup.seniority} ${call.setup.role}`}
                    onClick={() => setSheet({ kind: "again", setup: call.setup!, jdText: call.jdText })}
                  >
                    Run this again
                  </Button>
                ) : null
              }
            />
          )}
        </section>
      </div>

      <SetupSheet open={sheet !== null} start={sheet ?? closed} onClose={() => setSheet(null)} />
    </main>
  );
}
