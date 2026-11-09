import styles from "./InterviewerPlaceholder.module.css";

/** An interviewer who isn't live yet. Not a control, so it isn't focusable. */
export function InterviewerPlaceholder({ name }: { name: string; variant?: 0 | 1 }) {
  return (
    <div className={styles.card} aria-disabled="true">
      <span className={styles.blob} aria-hidden="true" />
      <span className={styles.name}>
        {name} · soon<span className="visually-hidden">, not taking calls yet</span>
      </span>
    </div>
  );
}
