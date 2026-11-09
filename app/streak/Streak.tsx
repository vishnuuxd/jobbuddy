"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { dayKey, streakWeek } from "@/lib/progress/streak";
import { saveProfile } from "@/lib/store/db";
import styles from "./streak.module.css";

/** Screen 2.3: shown once, the day a completed call starts a new streak. */
export function Streak() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const today = new Date();
    setNow(today);
    void saveProfile({ streakShownOn: dayKey(today) });
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.middle}>
        <Flame />
        <h1 className={styles.title}>Your streak starts today</h1>
        <p className={styles.sub}>One call a day keeps it going. A five minute one counts.</p>
        {now && (
          <ol className={styles.week} aria-label="This week">
            {streakWeek(now).map((day) => (
              <li key={day.key} className={day.today ? styles.today : undefined}>
                <span className={styles.dot} />
                <span className={styles.day}>
                  {day.label}
                  {day.today && <span className="visually-hidden">, done</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <Button variant="primary" size="big" block onClick={() => router.replace("/")}>
        See you tomorrow
      </Button>
    </main>
  );
}

function Flame() {
  return (
    <svg className={styles.flame} width="180" height="210" viewBox="0 0 180 210" aria-hidden="true">
      <path
        d="M98 8c8 30 38 52 52 84 18 42 2 104-60 110C34 207 10 166 14 124c3-30 20-48 32-60 2 22 12 32 22 36 2-38 8-64 30-92z"
        fill="var(--lime)"
      />
      <text x="88" y="160" textAnchor="middle" className={styles.flameNumber}>
        1
      </text>
    </svg>
  );
}
