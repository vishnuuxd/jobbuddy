"use client";

import { useEffect, useRef } from "react";
import styles from "./ScoreGauge.module.css";

// The overall score gauge from Paper 1.7b: a half circle that fills from 0 to the score out of 5.
const ARC = "M30 152 A120 120 0 0 1 270 152";
const sweepMs = 1_100;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function knobAt(fraction: number) {
  const angle = Math.PI * fraction;
  return { x: 150 - 120 * Math.cos(angle), y: 152 - 120 * Math.sin(angle) };
}

type Props = { score: number; word: string };

/** Sweeps from 0 to the score on every load, with the number counting up. */
export function ScoreGauge({ score, word }: Props) {
  const fill = useRef<SVGPathElement>(null);
  const knob = useRef<SVGCircleElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  const target = Math.max(0, Math.min(5, score)) / 5;

  useEffect(() => {
    function draw(fraction: number) {
      fill.current?.setAttribute("stroke-dasharray", `${fraction * 100} 100`);
      const { x, y } = knobAt(fraction);
      knob.current?.setAttribute("cx", x.toFixed(1));
      knob.current?.setAttribute("cy", y.toFixed(1));
      if (number.current) number.current.textContent = (fraction * 5).toFixed(1);
    }
    // Reduced motion shows the final state straight away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / sweepMs);
      draw(target * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else draw(target); // Land exactly on the score.
    }
    draw(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const start = knobAt(0);
  const label = `Overall score ${score.toFixed(1)} out of 5, ${word}`;

  return (
    <div className={styles.hero} role="img" aria-label={label}>
      <svg className={styles.svg} viewBox="0 0 300 172" aria-hidden="true">
        <path d={ARC} className={styles.outline} />
        <path d={ARC} className={styles.track} />
        <path ref={fill} d={ARC} pathLength={100} className={styles.fill} strokeDasharray="0 100" />
        <circle ref={knob} cx={start.x} cy={start.y} r="15" className={styles.knob} />
      </svg>
      <p className={styles.reading} aria-hidden="true">
        <span ref={number} className={styles.number}>
          0.0
        </span>
        <span className={styles.outOf}>/5</span>
      </p>
    </div>
  );
}
