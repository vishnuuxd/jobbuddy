import type { ComponentProps, ReactNode } from "react";
import styles from "./Chip.module.css";

const join = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

type SelectChipProps = Omit<ComponentProps<"button">, "children"> & {
  selected: boolean;
  /** "Other" and other open choices use a dashed outline. */
  dashed?: boolean;
  /** "tile" makes equal-width chips for a row of options like seniority. */
  shape?: "pill" | "tile";
  children: ReactNode;
};

/** A selectable option: outline pill, plum when selected. Put a group in a role="radiogroup". */
export function SelectChip({ selected, dashed, shape = "pill", className, children, ...rest }: SelectChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      {...rest}
      className={join(styles.select, styles[shape], dashed && !selected && styles.dashed, className)}
    >
      {children}
    </button>
  );
}

/** Status tones: lime for good news, plum for a strong one, grey for neutral, pink for attention. */
export type PillTone = "lime" | "plum" | "grey" | "pink";

export function StatusPill({ tone, className, children }: { tone: PillTone; className?: string; children: ReactNode }) {
  return <span className={join(styles.status, styles[tone], className)}>{children}</span>;
}

type TagProps = {
  tone?: "lime" | "white" | "pink" | "plum";
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A flat tag for the streak and Meera's reactions. Never rotated, never outlined. */
export function Tag({ tone = "lime", icon, className, children }: TagProps) {
  return (
    <span className={join(styles.tag, styles[`t-${tone}`], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Badges and similar wins: plain text with a small icon, so they never read as buttons. */
export function Badge({ icon, className, children }: { icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <span className={join(styles.badge, className)}>
      {icon && <span className={styles.badgeIcon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
