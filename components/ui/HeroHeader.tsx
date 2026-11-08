import type { ReactNode } from "react";
import styles from "./HeroHeader.module.css";

/** Pink header with a rounded bottom, for Home, the scorecard, History and Profile. */
export function HeroHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={`${styles.hero} ${className ?? ""}`}>{children}</header>;
}

// White on pink is 3.37:1, so white text in the header must be large: 19 px bold or bigger.
// Small meta lines are ink instead.

/** A greeting or short line in white, 19 px bold. */
export function HeroGreeting({ children }: { children: ReactNode }) {
  return <p className={styles.greeting}>{children}</p>;
}

/** A small meta line under the headline, in ink. */
export function HeroMeta({ children }: { children: ReactNode }) {
  return <p className={styles.meta}>{children}</p>;
}
