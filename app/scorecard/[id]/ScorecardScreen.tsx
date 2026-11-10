"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MeeraStatic } from "@/components/meera/MeeraStatic";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { Badge, StatusPill } from "@/components/ui/Chip";
import { HeroHeader, HeroMeta } from "@/components/ui/HeroHeader";
import { BackIcon, CloseIcon, FlameIcon, MedalIcon } from "@/components/ui/icons";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { SkillBar } from "@/components/ui/SkillBar";
import { StatTile } from "@/components/ui/StatTile";
import { setPendingCall } from "@/lib/call/pending";
import { callMeta, callTitle, streakDays } from "@/lib/home/format";
import { liveConfig } from "@/lib/live/config";
import { badgeList, callBadges } from "@/lib/progress/badges";
import { bestRetry, callSkillScores, deliveryStats, momentsFor, personalBests, retryChange, skillNames } from "@/lib/progress/score";
import { shouldShowStreak } from "@/lib/progress/streak";
import { callScore } from "@/lib/progress/overall";
import { scorecardMarkdown } from "@/lib/scorecard/markdown";
import { buildScorecard } from "@/lib/scorecard/request";
import { flagNames, transcriptItems } from "@/lib/scorecard/transcript";
import { useCall, useCalls, useProfile } from "@/lib/store/db";
import { skills, type Call, type ScoredAnswer } from "@/lib/store/types";
import styles from "./scorecard.module.css";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function ScorecardScreen({ id }: { id: string }) {
  const router = useRouter();
  const call = useCall(id);
  const calls = useCalls();
  const profile = useProfile();
  const [now, setNow] = useState<Date | null>(null);
  const [fresh, setFresh] = useState(false);
  const [tab, setTab] = useState<"scorecard" | "transcript">("scorecard");
  useEffect(() => {
    setNow(new Date());
    const params = new URLSearchParams(window.location.search);
    setFresh(params.has("fresh"));
    if (params.get("tab") === "transcript") setTab("transcript");
  }, []);

  if (call === undefined || !now || !calls) return <main className={styles.loading} />;
  if (call === null) {
    return (
      <main className={styles.page}>
        <div className={styles.body}>
          <p className={styles.quiet}>That call isn't on this phone any more.</p>
          <Button href="/history" variant="secondary" size="small" block>
            Go to History
          </Button>
        </div>
      </main>
    );
  }

  // Straight after a call: close to Home, through the streak screen the day a streak starts.
  const close = () => {
    if (!fresh) return router.back();
    router.push(shouldShowStreak(calls ?? [], profile?.streakShownOn, new Date()) ? "/streak" : "/");
  };
  const card = call.scorecard;
  if (!card) return <NoScorecard call={call} onClose={close} startTab={tab} />;

  const scores = callSkillScores(call)!;
  const bests = personalBests(calls);
  const moments = momentsFor(card);
  const stats = deliveryStats(call.metrics);
  const badges = callBadges(call, liveConfig.badges);
  const streak = streakDays(calls, now);
  const weakest = moments[0];
  const score = callScore(call);

  function retry(answer: ScoredAnswer) {
    if (!call?.setup) return;
    setPendingCall({
      setup: call.setup,
      cvText: call.cvText,
      jdText: call.jdText,
      retry: { callId: call.id, questionIndex: answer.questionIndex, question: questionText(call, answer), hint: answer.rewrite?.whatChanged },
    });
    router.push("/call");
  }

  function saveMarkdown() {
    const blob = new Blob([scorecardMarkdown(call!, new Date())], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `jobbuddy-${callTitle(call!).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className={styles.page}>
      <HeroHeader>
        <div className={styles.headTop}>
          <button type="button" className={`${styles.close} noPrint`} aria-label={fresh ? "Close, back to Home" : "Back"} onClick={close}>
            {fresh ? <CloseIcon /> : <BackIcon />}
          </button>
          <CallHeading call={call} now={now} />
        </div>
        {score && (
          <div className={styles.score}>
            <ScoreGauge score={score.score} word={score.word} />
            <p className={styles.word}>{score.word}</p>
            {score.lift > 0 && <p className={styles.lift}>+{score.lift.toFixed(1)} after retries</p>}
          </div>
        )}
        <div className={styles.saysBlock}>
          <div className={styles.says}>
            <MeeraStatic size={34} />
            <span className={styles.saysLabel}>Meera says</span>
          </div>
          <h1 className={styles.take}>{card.summary.meeraTake}</h1>
        </div>
      </HeroHeader>

      <div className={styles.body}>
        <div className={`${styles.tabs} noPrint`} role="tablist" aria-label="Scorecard or transcript">
          {(["scorecard", "transcript"] as const).map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              className={styles.tab}
              onClick={() => setTab(name)}
            >
              {name === "scorecard" ? "Scorecard" : "Transcript"}
            </button>
          ))}
        </div>

        {tab === "transcript" ? (
          <Transcript call={call} />
        ) : (
          <>
            <Card kind="lime" className={styles.oneThingCard}>
              <Eyebrow>Your one thing</Eyebrow>
              <h2 className={styles.oneThing}>{card.summary.oneThing.pattern}</h2>
              <p className={styles.oneThingText}>
                {card.summary.oneThing.evidence} {card.summary.oneThing.whyItMatters}
              </p>
            </Card>

            <section className={styles.section} aria-labelledby="skills-title">
              <h2 id="skills-title" className={styles.h2}>
                Skills
              </h2>
              <Card kind="white" className={styles.skills}>
                {skills.map((skill) => (
                  <SkillBar key={skill} label={skillNames[skill]} score={scores[skill]} best={bests[skill]} />
                ))}
                <p className={styles.caption}>The dark tick is your best so far.</p>
              </Card>
              {stats && (
                <div className={styles.tiles} aria-label="Delivery">
                  <StatTile value={String(stats.wpm)} label="words / min" />
                  <StatTile value={String(stats.fillersPerAnswer)} label="fillers each" />
                  <StatTile value={clock(stats.averageSeconds)} label="avg answer" />
                </div>
              )}
            </section>

            <section className={styles.section} aria-labelledby="moments-title">
              <div className={styles.sectionHead}>
                <h2 id="moments-title" className={styles.h2}>
                  Moments to fix
                </h2>
                <span className={styles.quiet}>
                  {moments.length} of {card.answers.length} answers
                </span>
              </div>
              {moments.map((moment, index) => (
                <Moment key={moment.questionIndex} call={call} answer={moment} full={index === 0} onRetry={() => retry(moment)} />
              ))}
            </section>

            <Card kind="lavender" className={styles.well}>
              <Eyebrow>What went well</Eyebrow>
              <p className={styles.wellText}>{card.summary.strongest.why}</p>
            </Card>

            {(badges.length > 0 || streak > 0) && (
              <section className={styles.wins} aria-labelledby="wins-title">
                <h2 id="wins-title" className={styles.label}>
                  Wins from this call
                </h2>
                <ul className={styles.winList}>
                  {badges.map((id) => (
                    <li key={id}>
                      <Badge icon={<MedalIcon />}>{badgeList.find((item) => item.id === id)!.name}</Badge>
                    </li>
                  ))}
                  {streak > 0 && (
                    <li>
                      <Badge icon={<FlameIcon size={18} />}>{streak} day streak</Badge>
                    </li>
                  )}
                </ul>
              </section>
            )}

            <div className={`${styles.actions} noPrint`}>
              {weakest && !bestRetry(call, weakest.questionIndex) ? (
                <Button variant="primary" size="big" block onClick={() => retry(weakest)}>
                  Retry the weakest answer
                </Button>
              ) : (
                <Button href={`/?sheet=again&id=${call.id}`} variant="primary" size="big" block>
                  Run this again
                </Button>
              )}
              <Button href="/?sheet=new" variant="ink" size="small" block>
                New interview
              </Button>
              <div className={styles.saveRow}>
                <Button variant="text" onClick={() => window.print()}>
                  Save as PDF →
                </Button>
                <Button variant="text" onClick={saveMarkdown}>
                  Save as Markdown →
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Flagged lines: lime for missing results and rambling, pink for hedging and fillers, grey otherwise.
const flagTones: Record<string, "lime" | "pink" | "grey"> = { no_result: "lime", rambling: "lime", hedging: "pink", filler: "pink", off_question: "grey", pace: "grey" };

/** Screen 4.3: every line, with flagged moments highlighted by type. */
function Transcript({ call }: { call: Call }) {
  const items = transcriptItems(call);
  if (items.length === 0) return <p className={styles.quiet}>No transcript for this call.</p>;
  return (
    <ol className={styles.transcript}>
      {items.map((item, index) =>
        item.speaker === "agent" ? (
          <li key={index} className={styles.agentLine}>
            <p className={styles.who}>Meera · {clock(Math.round(item.startSec))}</p>
            <p className={styles.agentText}>{item.text}</p>
          </li>
        ) : item.flag ? (
          <li key={index} className={`${styles.flagged} ${styles[`flag-${flagTones[item.flag.type] ?? "grey"}`]}`}>
            <p className={styles.flagHead}>
              <StatusPill tone="plum">
                {flagNames[item.flag.type] ?? item.flag.type} · {clock(Math.round(item.startSec))}
              </StatusPill>
              <span className={styles.flagSource}>{item.flag.source === "agent" ? "Flagged by Meera" : "Spotted live"}</span>
            </p>
            <p className={styles.flagText}>{item.text}</p>
          </li>
        ) : (
          <li key={index} className={styles.userLine}>
            <p className={styles.whoYou}>You · {clock(Math.round(item.startSec))}</p>
            <p className={styles.userText}>{item.text}</p>
          </li>
        ),
      )}
    </ol>
  );
}

/** 1.7b: the call's name, with its day and length in a small line under it. */
function CallHeading({ call, now }: { call: Call; now: Date }) {
  return (
    <div className={styles.heading}>
      <p className={styles.name}>{callTitle(call)}</p>
      <HeroMeta>{callMeta(call, now)}</HeroMeta>
    </div>
  );
}

/** The question as Meera asked it, from the transcript, falling back to the model's short name. */
function questionText(call: Call, answer: ScoredAnswer) {
  const asked = [...call.transcript].reverse().find((line) => line.speaker === "agent" && line.questionIndex === answer.questionIndex && line.text.includes("?"));
  return asked?.text ?? answer.question;
}

function Moment({ call, answer, full, onRetry }: { call: Call; answer: ScoredAnswer; full: boolean; onRetry: () => void }) {
  const retry = bestRetry(call, answer.questionIndex);
  const change = retry ? retryChange(answer, retry).total : 0;
  const improved = retry && change > 0;
  const retryLink = `/scorecard/${call.id}/retry/${answer.questionIndex}`;

  if (!full) {
    return (
      <Card kind="white" className={styles.moment}>
        <p className={styles.momentHead}>
          Question {answer.questionIndex} · {answer.question}
        </p>
        <p className="t-body">{answer.rewrite?.whatChanged || answer.flagged?.quote}</p>
        {answer.flagged?.whyItMatters && <p className={styles.why}>Why: {answer.flagged.whyItMatters}</p>}
        {improved ? (
          <Link href={retryLink} className={styles.retryLink}>
            Improved +{change} · see before and after →
          </Link>
        ) : (
          <button type="button" className={styles.retryLink} aria-label={`Retry question ${answer.questionIndex}`} onClick={onRetry}>
            Retry this answer →
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card kind="white" className={styles.moment}>
      <p className={styles.momentHead}>
        Question {answer.questionIndex} · {answer.question}
      </p>
      {answer.rewrite && (
        <>
          <div className={styles.said}>
            <p className={styles.saidLabel}>You said</p>
            <p className="t-body">“{answer.rewrite.original}”</p>
          </div>
          <div className={styles.try}>
            <p className={styles.tryLabel}>Try this</p>
            <p className="t-body">“{answer.rewrite.improved}”</p>
          </div>
        </>
      )}
      {improved ? (
        <div className={styles.pair}>
          <Button href={retryLink} variant="ink" size="small">
            Improved +{change}
          </Button>
          <Button variant="quiet" size="small" onClick={onRetry}>
            Retry again
          </Button>
        </div>
      ) : (
        <Button variant="ink" size="small" block onClick={onRetry}>
          Retry this answer
        </Button>
      )}
    </Card>
  );
}

/** A call without a scorecard: rebuild it if it failed, and read the transcript either way. */
function NoScorecard({ call, onClose, startTab }: { call: Call; onClose: () => void; startTab: "scorecard" | "transcript" }) {
  const [building, setBuilding] = useState(false);
  const [failedAgain, setFailedAgain] = useState(false);
  const failed = call.status === "scoring_failed";
  return (
    <main className={styles.page}>
      <HeroHeader>
        <div className={styles.headTop}>
          <button type="button" className={styles.close} aria-label="Back" onClick={onClose}>
            <BackIcon />
          </button>
          <CallHeading call={call} now={new Date()} />
        </div>
        <h1 className={styles.take}>{failed ? "No scorecard yet" : "This call was cut short"}</h1>
      </HeroHeader>
      <div className={styles.body}>
        {startTab !== "transcript" && (
          <>
            <p className={styles.quiet}>
              {failed ? "Writing it up didn't work last time. Nothing is lost: the transcript is below." : "Fewer than two answers, so there's no scorecard. The transcript is below."}
            </p>
            {failed && (
              <Button
                variant="primary"
                size="big"
                block
                loading={building}
                onClick={async () => {
                  setBuilding(true);
                  const result = await buildScorecard(call.id);
                  setBuilding(false);
                  setFailedAgain(result?.status !== "completed");
                }}
              >
                Build scorecard
              </Button>
            )}
            {failedAgain && (
              <p className={styles.quiet} role="alert">
                Try again after some time.
              </p>
            )}
          </>
        )}
        <h2 className={styles.label}>Transcript</h2>
        <Transcript call={call} />
      </div>
    </main>
  );
}
