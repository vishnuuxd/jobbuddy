import type { ComponentProps, ReactNode } from "react";
import styles from "./Chip.module.css";

const join = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

type SelectChipProps = Omit<ComponentProps<"button">, "children"> & {
  selected: boolean;
  /** "Other" and other open choices use a dashed outline. */
  dashed?: boolean;
  /** Square ends, for a row of equal options like seniority. */
  shape?: "pill" | "tile";
  children: ReactNode;
};

/** A selectable option. Put a group of these in a role="radiogroup" or role="group". */
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

export type PillTone = "mint" | "cream" | "pink" | "grey";

export function StatusPill({ tone, className, children }: { tone: PillTone; className?: string; children: ReactNode }) {
  return <span className={join(styles.status, styles[tone], className)}>{children}</span>;
}

type StickerProps = {
  tone?: "sun" | "white" | "mint" | "pink";
  /** Degrees. The screens use -5 to 3. */
  tilt?: number;
  /** White outline, for stickers that sit on ink. */
  onDark?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Sticker({ tone = "sun", tilt = -3, onDark, icon, className, children }: StickerProps) {
  return (
    <span
      className={join(styles.sticker, styles[`s-${tone}`], onDark && styles.stickerOnDark, icon ? styles.withIcon : undefined, className)}
      style={{ rotate: `${tilt}deg` }}
    >
      {icon && <span className={styles.stickerIcon}>{icon}</span>}
      {children}
    </span>
  );
}
