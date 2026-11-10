"use client";

import { useEffect, useState } from "react";
import { CallList } from "@/components/CallRow";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { MedalIcon, TrashIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { bestStreak, callTitle, lastSevenDays, streakDays, streakNote } from "@/lib/home/format";
import { liveConfig } from "@/lib/live/config";
import { badgeCounts, badgeList } from "@/lib/progress/badges";
import { personalBests, skillNames } from "@/lib/progress/score";
import { buildScorecard } from "@/lib/scorecard/request";
import { deleteCall, useCalls } from "@/lib/store/db";
import { skills, type Call } from "@/lib/store/types";
import styles from "../tabs.module.css";

/** Screen 4.1: completion, personal bests, badges and every call. */
export function History() {
  const calls = useCalls();
  const [now, setNow] = useState<Date | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const [buildFailed, setBuildFailed] = useState(false);
  const [menuFor, setMenuFor] = useState<Call | null>(null);
  useEffect(() => setNow(new Date()), []);

  const streak = calls && now ? streakDays(calls, now) : 0;
  const week = calls && now ? lastSevenDays(calls, now) : [];
  const practisedToday = week.at(-1)?.done ?? false;
  const bests = calls ? personalBests(calls) : {};
  const topBest = Math.max(0, ...Object.values(bests).map(Number));
  const counts = calls ? badgeCounts(calls, liveConfig.badges) : null;
  // Only earned badges are shown.
  const earned = counts ? badgeList.filter((badge) => counts[badge.id] > 0) : [];

  async function rebuild(call: Call) {
    setBuilding(call.id);
    setBuildFailed(false);
    const result = await buildScorecard(call.id);
    setBuilding(null);
    setBuildFailed(!!result && result.status !== "completed");
  }

  return (
    <main>
      <HeroHeader>
        <div className={styles.streakHead}>
          <HeroGreeting>History</HeroGreeting>
          {calls && now && (
            <>
              <p className={styles.streakLine}>
                <span className={styles.streakNumber}>{streak}</span>
                <span className={styles.streakWords}> day streak</span>
              </p>
              <p className={styles.streakNote}>{streakNote(streak, bestStreak(calls), practisedToday)}</p>
              <ol className={styles.week} aria-label="The last 7 days">
                {week.map((day) => (
                  <li key={day.key} className={day.today ? styles.weekToday : undefined}>
                    <span
                      className={`${styles.weekDot} ${day.done ? styles.weekDone : day.today ? styles.weekOpen : ""}`}
                      aria-hidden="true"
                    />
                    {day.label}
                    <span className="visually-hidden">{day.done ? ", practised" : ", no call"}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
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
          <>
            <section className={styles.stackTight} aria-labelledby="bests-title">
              <h2 id="bests-title" className={styles.sectionHead}>
                Personal bests
              </h2>
              {topBest > 0 ? (
                <div className={styles.bests}>
                  {skills.map((skill) => (
                    <div key={skill} className={`${styles.best} ${bests[skill] === topBest ? styles.bestTop : ""}`}>
                      <span className={styles.bestNumber}>{bests[skill] ?? "–"}</span>
                      <span className={styles.bestLabel}>{skillNames[skill]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.quiet}>Your best score per skill shows up after your first scorecard.</p>
              )}
            </section>

            {counts && (
              <section className={styles.stackTight} aria-labelledby="badges-title">
                <h2 id="badges-title" className={styles.sectionHead}>
                  Badges
                </h2>
                {earned.length > 0 ? (
                  <ul className={styles.badges}>
                    {earned.map((badge) => (
                      <li key={badge.id}>
                        <Badge icon={<MedalIcon />}>
                          {badge.name}
                          {counts[badge.id] > 1 ? ` ×${counts[badge.id]}` : ""}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.quiet}>Badges you earn on calls show up here.</p>
                )}
              </section>
            )}

            <section aria-labelledby="all-title">
              <h2 id="all-title" className={styles.sectionHead}>
                All calls
              </h2>
              {buildFailed && (
                <p className={`${styles.quiet} ${styles.buildNote}`} role="alert">
                  Try again after some time.
                </p>
              )}
              <CallList
                calls={calls}
                now={now}
                showScore
                actionFor={(call) => (
                  <>
                    {call.status === "scoring_failed" && (
                      <Button variant="ink" size="compact" className={styles.build} loading={building === call.id} onClick={() => void rebuild(call)}>
                        Build scorecard
                      </Button>
                    )}
                    <button type="button" className={styles.more} aria-label={`More for ${callTitle(call)}`} onClick={() => setMenuFor(call)}>
                      <span aria-hidden="true">⋯</span>
                    </button>
                  </>
                )}
              />
            </section>
          </>
        )}
      </div>

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor ? callTitle(menuFor) : "Call"} showTitle>
        <div className={styles.stackTight}>
          <p className={styles.quiet}>Deleting removes the call, its scorecard and retries from this phone. It can't be undone.</p>
          <Button
            variant="danger"
            size="big"
            block
            onClick={async () => {
              if (menuFor) await deleteCall(menuFor.id);
              setMenuFor(null);
            }}
          >
            <TrashIcon />
            Delete this call
          </Button>
          <Button variant="quiet" size="small" block onClick={() => setMenuFor(null)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
