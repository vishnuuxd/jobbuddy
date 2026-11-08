import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/Chip";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { callScore } from "@/lib/progress/overall";
import { callMeta, callPill, callTitle } from "@/lib/home/format";
import type { Call } from "@/lib/store/types";
import styles from "./CallRow.module.css";

/** Calls with a scorecard, or a failed one to rebuild, open their scorecard screen. */
export const callHref = (call: Call) => (call.status === "incomplete" ? null : `/scorecard/${call.id}`);

type Props = { call: Call; now: Date; action?: ReactNode; extra?: ReactNode; showScore?: boolean };

export function CallRow({ call, now, action, extra, showScore }: Props) {
  // History shows the overall score in place of the pill. A failed scorecard gets "Build scorecard" instead.
  const score = showScore ? callScore(call) : null;
  const pill = score || (call.status === "scoring_failed" && action) ? null : callPill(call);
  const summary = showScore ? call.scorecard?.summary.oneThing.pattern : undefined;
  const meta = callMeta(call, now);
  const href = callHref(call);
  const body = (
    <>
      <span className={styles.text}>
        <span className={styles.title}>{callTitle(call)}</span>
        <span className={styles.meta}>
          {meta}
          {extra}
        </span>
        {score && (
          <span className={styles.summary}>
            <span className={styles.scoreWord}>{score.word}</span>
            {summary && ` · ${summary}`}
          </span>
        )}
      </span>
      {score && (
        <span className={styles.score}>
          <ScoreGauge score={score.score} word={score.word} size="small" />
          <span className={styles.scoreNumber} aria-hidden="true">
            {score.score.toFixed(1)}
          </span>
        </span>
      )}
      {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
    </>
  );
  return (
    <li className={styles.row}>
      {href ? (
        <Link href={href} className={styles.main}>
          {body}
        </Link>
      ) : (
        <span className={styles.main}>{body}</span>
      )}
      {action}
    </li>
  );
}

export function CallList({
  calls,
  now,
  actionFor,
  showScore,
}: {
  calls: Call[];
  now: Date;
  actionFor?: (call: Call, index: number) => ReactNode;
  showScore?: boolean;
}) {
  return (
    <ul className={styles.list}>
      {calls.map((call, index) => (
        <CallRow key={call.id} call={call} now={now} action={actionFor?.(call, index)} showScore={showScore} />
      ))}
    </ul>
  );
}
