"use client";

import { useEffect, useState } from "react";
import { CallList } from "@/components/CallRow";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Chip";
import { HeroGreeting, HeroHeader } from "@/components/ui/HeroHeader";
import { Sheet } from "@/components/ui/Sheet";
import { callTitle } from "@/lib/home/format";
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
  const [menuFor, setMenuFor] = useState<Call | null>(null);
  useEffect(() => setNow(new Date()), []);

  const done = calls?.filter((call) => call.status === "completed").length ?? 0;
  const bests = calls ? personalBests(calls) : {};
  const topBest = Math.max(0, ...Object.values(bests).map(Number));
  const counts = calls ? badgeCounts(calls, liveConfig.badges) : null;
  const earned = counts ? badgeList.filter((badge) => counts[badge.id] > 0).length : 0;

  async function rebuild(call: Call) {
    setBuilding(call.id);
    await buildScorecard(call.id);
    setBuilding(null);
  }

  return (
    <main>
      <HeroHeader>
        <HeroGreeting>History</HeroGreeting>
        {calls && (
          <p className={styles.bigRate}>
            <span className={styles.bigNumber}>
              {done} of {calls.length}
            </span>
            <span className={styles.bigLabel}>interviews completed</span>
          </p>
        )}
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
                  Badges · {earned} of {badgeList.length}
                </h2>
                <div className={styles.badges}>
                  {badgeList.map((badge, index) =>
                    counts[badge.id] > 0 ? (
                      <Sticker key={badge.id} tone={badge.tone} tilt={index % 2 ? 2 : -2}>
                        {badge.name}
                        {counts[badge.id] > 1 ? ` ×${counts[badge.id]}` : ""}
                      </Sticker>
                    ) : (
                      <span key={badge.id} className={styles.locked}>
                        {badge.name}
                        <span className="visually-hidden">, not earned yet</span>
                      </span>
                    ),
                  )}
                </div>
              </section>
            )}

            <section aria-labelledby="all-title">
              <h2 id="all-title" className={styles.sectionHead}>
                All calls
              </h2>
              <CallList
                calls={calls}
                now={now}
                showScore
                actionFor={(call) => (
                  <>
                    {call.status === "scoring_failed" && (
                      <Button variant="secondary" size="compact" className={styles.build} loading={building === call.id} onClick={() => void rebuild(call)}>
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
            variant="primary"
            block
            onClick={async () => {
              if (menuFor) await deleteCall(menuFor.id);
              setMenuFor(null);
            }}
          >
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
