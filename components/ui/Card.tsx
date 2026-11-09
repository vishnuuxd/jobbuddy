import type { ComponentProps } from "react";
import styles from "./Card.module.css";

/** white: plain card. lime: highlight (Your one thing). lavender: accent (What went well).
    pink: soft attention. dashed: placeholder. plum: a card on a plum background. */
export type CardKind = "white" | "lime" | "lavender" | "pink" | "dashed" | "plum";

export function Card({ kind = "white", className, ...rest }: ComponentProps<"div"> & { kind?: CardKind }) {
  return <div {...rest} className={[styles.card, styles[kind], className].filter(Boolean).join(" ")} />;
}

export function Eyebrow({ tone = "dark", children }: { tone?: "dark" | "muted"; children: React.ReactNode }) {
  return <p className={`${styles.eyebrow} ${styles[`e-${tone}`]}`}>{children}</p>;
}
