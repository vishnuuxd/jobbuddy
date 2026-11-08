import styles from "./InterviewerPlaceholder.module.css";

/** An interviewer who isn't live yet. Not a control, so it isn't focusable. */
export function InterviewerPlaceholder({ name, variant = 0 }: { name: string; variant?: 0 | 1 }) {
  return (
    <div className={styles.card} aria-disabled="true">
      <span className={`${styles.blob} ${styles[`b${variant}`]}`} aria-hidden="true" />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.status}>Not taking calls</span>
      </span>
    </div>
  );
}
