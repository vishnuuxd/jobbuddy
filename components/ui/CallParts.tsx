import type { ComponentProps, ReactNode } from "react";
import styles from "./CallParts.module.css";

/** One segment per main question: done is mint, current is sun, upcoming is dim. */
export function ProgressSegments({ total, current }: { total: number; current: number }) {
  return (
    <div className={styles.segments} role="img" aria-label={`Question ${current} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const state = step < current ? styles.done : step === current ? styles.current : styles.upcoming;
        return <span key={step} className={`${styles.segment} ${state}`} />;
      })}
    </div>
  );
}

export function CallPill({ children }: { children: ReactNode }) {
  return <span className={styles.pill}>{children}</span>;
}

export function QuestionCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.question}>
      <p className={styles.questionLabel}>{label}</p>
      <p className={styles.questionText}>{children}</p>
    </div>
  );
}

type ControlProps = ComponentProps<"button"> & { label: string; end?: boolean; pressed?: boolean };

/** Round call control on plum: mic and camera. `end` makes the pink "End call" pill. No attach: CVs and job posts come from the setup sheet. */
export function CallControl({ label, end, pressed, className, children, ...rest }: ControlProps) {
  return (
    <button
      type="button"
      aria-label={end ? undefined : label}
      aria-pressed={end ? undefined : pressed}
      {...rest}
      className={`${styles.control} ${end ? styles.end : ""} ${className ?? ""}`}
    >
      {end ? (
        <>
          {children}
          {label}
        </>
      ) : (
        children
      )}
    </button>
  );
}
