import { StatusPill } from "@/components/ui/Chip";
import { callMeta, callPill, callTitle } from "@/lib/home/format";
import type { Call } from "@/lib/store/types";
import styles from "./CallRow.module.css";

/** One past call. Rows open their scorecard once it exists (phase 5). */
export function CallRow({ call, now }: { call: Call; now: Date }) {
  const pill = callPill(call);
  return (
    <li className={styles.row}>
      <span className={styles.text}>
        <span className={styles.title}>{callTitle(call)}</span>
        <span className={styles.meta}>{callMeta(call, now)}</span>
      </span>
      {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
    </li>
  );
}

export function CallList({ calls, now }: { calls: Call[]; now: Date }) {
  return (
    <ul className={styles.list}>
      {calls.map((call) => (
        <CallRow key={call.id} call={call} now={now} />
      ))}
    </ul>
  );
}
