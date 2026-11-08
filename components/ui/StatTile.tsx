import styles from "./StatTile.module.css";

export function StatTile({ value, label, tone = "soft" }: { value: string; label: string; tone?: "soft" | "mint" }) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
