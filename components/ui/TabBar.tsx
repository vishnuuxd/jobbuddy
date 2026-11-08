"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HistoryIcon, HomeIcon, ProfileIcon } from "./icons";
import styles from "./TabBar.module.css";

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Docked bottom tabs for Home, History and Profile. `current` overrides the route, for /kit. */
export function TabBar({ current, docked = true }: { current?: string; docked?: boolean }) {
  const pathname = usePathname();
  const active = current ?? pathname;

  return (
    <nav className={`${styles.bar} ${docked ? styles.docked : ""}`} aria-label="Main">
      {tabs.map(({ href, label, Icon }) => {
        const on = isActive(active, href);
        return (
          <Link key={href} href={href} className={styles.tab} aria-current={on ? "page" : undefined}>
            <Icon active={on} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
