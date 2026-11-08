"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusPill, Sticker } from "@/components/ui/Chip";
import { setPendingCall } from "@/lib/call/pending";
import { answerTotal, momentsFor, retryChange, skillNames } from "@/lib/progress/score";
import { useCall } from "@/lib/store/db";
import { skills, type Skill } from "@/lib/store/types";
import styles from "./retry.module.css";

/** Screen 2.2: the old answer next to the new one, and the change per skill. */
export function RetryResult({ id, questionIndex }: { id: string; questionIndex: number }) {
  const router = useRouter();
  const call = useCall(id);
  if (call === undefined) return <main className={styles.loading} />;

  const original = call?.scorecard?.answers.find((answer) => answer.questionIndex === questionIndex);
  const retries = (call?.retries ?? []).filter((retry) => retry.questionIndex === questionIndex);
  const latest = retries.at(-1);
  if (!call || !original || !latest) {
    router.replace(call ? `/scorecard/${id}` : "/history");
    return <main className={styles.loading} />;
  }

  const { perSkill, total } = retryChange(original, latest);
  const improved = total > 0;
  // Comeback is new when this is the first retry on the call that beat its original.
  const earlierWins = call.retries.slice(0, call.retries.indexOf(latest)).some((retry) => {
    const answer = call.scorecard!.answers.find((item) => item.questionIndex === retry.questionIndex);
    return answer && answerTotal(retry.answer) > answerTotal(answer);
  });
  const newComeback = improved && !earlierWins;
  const top = skills.reduce<Skill>((best, skill) => (perSkill[skill] > perSkill[best] ? skill : best), skills[0]);
  const said = original.rewrite?.original || original.flagged?.quote || "";
  const now = latest.transcript.filter((line) => line.speaker === "user").map((line) => line.text).join(" ");
  const shown = skills.filter((skill) => perSkill[skill] !== 0).concat(skills.filter((skill) => perSkill[skill] === 0)).slice(0, 3);
  const next = momentsFor(call.scorecard!).find(
    (answer) => answer.questionIndex !== questionIndex && !call.retries.some((retry) => retry.questionIndex === answer.questionIndex),
  );

  function retryNext() {
    if (!next || !call?.setup) return;
    setPendingCall({
      setup: call.setup,
      cvText: call.cvText,
      jdText: call.jdText,
      retry: { callId: call.id, questionIndex: next.questionIndex, question: next.question, hint: next.rewrite?.whatChanged },
    });
    router.push("/call");
  }

  return (
    <main className={styles.page}>
      <header className={`${styles.hero} ${improved ? styles.win : ""}`}>
        {improved && <Confetti />}
        {newComeback && (
          <Sticker tilt={-3} className={styles.badge}>
            New badge · Comeback
          </Sticker>
        )}
        <div className={styles.headline}>
          <h1 className={styles.title}>{improved ? "You landed it this time." : "Not quite yet."}</h1>
          <Sticker tone="white" tilt={4}>
            {total > 0 ? `+${total}` : total} overall
          </Sticker>
        </div>
        <p className={styles.sub}>
          {improved
            ? `${skillNames[top]} went from ${original.scores[top]} to ${latest.answer.scores[top]} on ${original.question.toLowerCase()}.`
            : "Same as before or a little lower. One more go, ending with what changed."}
        </p>
      </header>

      <div className={styles.body}>
        <div className={styles.before}>
          <p className={styles.label}>Before</p>
          <p className={styles.quote}>“{said}”</p>
        </div>
        <div className={styles.after}>
          <p className={styles.labelNow}>Just now</p>
          <p className={styles.quoteNow}>“{now}”</p>
        </div>

        <ul className={styles.changes}>
          {shown.map((skill) => (
            <li key={skill}>
              <span className={styles.skill}>{skillNames[skill]}</span>
              <span className={styles.scores}>
                {original.scores[skill]} → <strong>{latest.answer.scores[skill]}</strong>
              </span>
              {perSkill[skill] > 0 ? (
                <StatusPill tone="mint">+{perSkill[skill]}</StatusPill>
              ) : perSkill[skill] < 0 ? (
                <StatusPill tone="pink">{perSkill[skill]}</StatusPill>
              ) : (
                <StatusPill tone="grey">same</StatusPill>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Button href={`/scorecard/${id}`} variant="primary" block>
            Back to scorecard
          </Button>
          {next && (
            <Button variant="text" onClick={retryNext}>
              Retry Question {next.questionIndex} next
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

/** A few static shapes from 2.2. They pop in once, and stay still under reduced motion. */
function Confetti() {
  return (
    <div className={styles.confetti} aria-hidden="true">
      <span style={{ top: 34, right: 70, width: 14, height: 14, background: "var(--sun)", borderRadius: 7 }} />
      <span style={{ top: 70, right: 24, width: 22, height: 8, background: "var(--white)", rotate: "35deg" }} />
      <span style={{ top: 112, right: 112, width: 11, height: 11, background: "var(--mint)", rotate: "20deg" }} />
      <span style={{ top: 140, right: 40, width: 12, height: 12, background: "var(--ink)", borderRadius: 6 }} />
    </div>
  );
}
