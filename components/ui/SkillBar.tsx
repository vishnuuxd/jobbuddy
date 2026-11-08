import styles from "./SkillBar.module.css";

const tone = (score: number) => (score <= 2 ? "low" : score === 3 ? "mid" : "high");

type Props = { label: string; score: number; best?: number; max?: number };

/** One skill on the 1 to 5 rubric. The ink tick marks the personal best. */
export function SkillBar({ label, score, best, max = 5 }: Props) {
  const percent = (value: number) => `${(value / max) * 100}%`;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={score}
        aria-valuetext={best ? `${score} of ${max}, best ${best}` : `${score} of ${max}`}
      >
        <span className={`${styles.fill} ${styles[tone(score)]}`} style={{ width: percent(score) }} />
        {best !== undefined && <span className={styles.best} style={{ left: `calc(${percent(best)} - 2px)` }} />}
      </span>
      <span className={styles.score} aria-hidden="true">
        {score}
      </span>
    </div>
  );
}
