import type { ComponentProps } from "react";
import styles from "./Card.module.css";

export type CardKind = "hero" | "calm" | "cream" | "mint" | "pink" | "placeholder";

type Props = ComponentProps<"div"> & {
  kind?: CardKind;
  /** Ink outline on a tint card, for the one that matters most on screen. */
  outlined?: boolean;
  /** Hard ink shadow on a tint card. */
  raised?: boolean;
};

export function Card({ kind = "calm", outlined, raised, className, ...rest }: Props) {
  const cls = [styles.card, styles[kind], outlined && styles.outlined, raised && styles.raised, className]
    .filter(Boolean)
    .join(" ");
  return <div {...rest} className={cls} />;
}

export function Eyebrow({ tone = "cream", children }: { tone?: "cream" | "mint" | "pink" | "muted"; children: React.ReactNode }) {
  return <p className={`${styles.eyebrow} ${styles[`e-${tone}`]}`}>{children}</p>;
}
