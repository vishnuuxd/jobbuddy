import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/Chip";
import { callMeta, callPill, callTitle } from "@/lib/home/format";
import type { Call } from "@/lib/store/types";
import styles from "./CallRow.module.css";

/** Calls with a scorecard, or a failed one to rebuild, open their scorecard screen. */
export const callHref = (call: Call) => (call.status === "incomplete" ? null : `/scorecard/${call.id}`);

type Props = { call: Call; now: Date; action?: ReactNode; extra?: ReactNode };

export function CallRow({ call, now, action, extra }: Props) {
  // A failed scorecard gets a "Build scorecard" button in History instead of its pill.
  const pill = call.status === "scoring_failed" && action ? null : callPill(call);
  const href = callHref(call);
  const body = (
    <>
      <span className={styles.text}>
        <span className={styles.title}>{callTitle(call)}</span>
        <span className={styles.meta}>
          {callMeta(call, now)}
          {extra}
        </span>
      </span>
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

export function CallList({ calls, now, actionFor }: { calls: Call[]; now: Date; actionFor?: (call: Call, index: number) => ReactNode }) {
  return (
    <ul className={styles.list}>
      {calls.map((call, index) => (
        <CallRow key={call.id} call={call} now={now} action={actionFor?.(call, index)} />
      ))}
    </ul>
  );
}
