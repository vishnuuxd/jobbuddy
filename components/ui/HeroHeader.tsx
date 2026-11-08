import type { ReactNode } from "react";
import styles from "./HeroHeader.module.css";

/** Pink header with a rounded bottom, for Home, the scorecard, History and Profile. */
export function HeroHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={`${styles.hero} ${className ?? ""}`}>{children}</header>;
}
