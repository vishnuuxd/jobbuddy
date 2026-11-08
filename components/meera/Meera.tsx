"use client";

import { useEffect, useRef } from "react";
import type { InterviewVM } from "@/lib/avatar/interviewVM";
import type { Mood, Trigger } from "@/lib/avatar/interviewVM";
import { faceFor, triggerMs, type Eyes, type Face, type Fired, type Mouth, type Posture } from "@/lib/avatar/meeraFace";
import styles from "./Meera.module.css";

/** A fixed moment, for previews: no animation loop runs. */
export type MeeraStill = { mood: Mood; trigger?: Trigger; mouthOpen?: number; posture?: Posture };

type Props = {
  vm?: InterviewVM;
  still?: MeeraStill;
  /** Rendered width and height in px. Drawn on a 240 grid. */
  size?: number;
  /** Not connected: grey body and dash eyes. A display state, not an InterviewVM value. */
  offline?: boolean;
  /** White face with an ink outline and no sun dot, for pink grounds like the scorecard header. */
  tone?: "pink" | "light";
  className?: string;
};

// Body from the Paper blob: a 216 × 210 box at (12, 18) with radii
// 48%/52% 52%/44% 46%/56% 54%/48%, drawn as four elliptical arcs.
const BODY =
  "M115.7 18A112.3 92.4 0 0 1 228 110.4A99.4 117.6 0 0 1 128.6 228A116.6 100.8 0 0 1 12 127.2A103.7 109.2 0 0 1 115.7 18Z";
const RING =
  "M120 6C171.746 6.079 216.948 40.084 230.086 88.817C243.224 137.551 221.003 188.788 175.968 213.604C130.933 238.419 74.381 230.587 38.238 194.53C2.095 158.472 -4.572 103.234 22 60";

const EYE_X = [87, 139];
const eyeShapes: Record<Eyes, { w: number; h: number; y: number }> = {
  tall: { w: 16, h: 26, y: 124 },
  wide: { w: 19, h: 30, y: 120 },
  flat: { w: 18, h: 12, y: 124 },
  down: { w: 18, h: 10, y: 132 },
  worried: { w: 17, h: 16, y: 126 },
};
const mouthPaths: Record<Exclude<Mouth, "talk" | "round" | "none">, string> = {
  smile: "M100 152Q120 170 140 152",
  flat: "M104 158H136",
  wavy: "M100 158Q107 150 114 158T128 158T142 158",
};

/** Meera, the v2 stand-in until the rig. Reads InterviewVM only: the app never animates her. */
export function Meera({ vm, still, size = 240, offline = false, tone = "pink", className }: Props) {
  const light = tone === "light" && !offline;
  const figure = useRef<SVGGElement>(null);
  const sun = useRef<SVGCircleElement>(null);
  const eyes = useRef<(SVGRectElement | null)[]>([]);
  const mouthLine = useRef<SVGPathElement>(null);
  const mouthOval = useRef<SVGEllipseElement>(null);
  const ring = useRef<SVGPathElement>(null);
  const notepad = useRef<SVGGElement>(null);

  useEffect(() => {
    if (offline) return;

    function draw(face: Face, open: number, calm: boolean, now: number) {
      const breath = calm ? 0 : Math.sin((now / 4600) * Math.PI * 2) * 0.012;
      const swell = calm ? 0 : open * 0.03;
      const sx = face.scaleX + swell - breath / 2;
      const sy = face.scaleY + swell + breath;
      const lift = calm ? 0 : face.lift;
      figure.current?.setAttribute("transform", `translate(120 ${228 + lift}) scale(${sx} ${sy}) translate(-120 -228)`);
      sun.current?.setAttribute("r", String(20 * (calm ? 1 : face.sun)));

      const shape = eyeShapes[face.eyes];
      eyes.current.forEach((eye, index) => {
        if (!eye) return;
        eye.setAttribute("x", String(EYE_X[index] - shape.w / 2));
        eye.setAttribute("y", String(shape.y - shape.h / 2));
        eye.setAttribute("width", String(shape.w));
        eye.setAttribute("height", String(shape.h));
        eye.setAttribute("rx", String(Math.min(shape.w, shape.h) / 2));
      });

      const oval = face.mouth === "round" || face.mouth === "talk";
      const line = !oval && face.mouth !== "none";
      mouthLine.current?.setAttribute("d", line ? mouthPaths[face.mouth as keyof typeof mouthPaths] : "");
      if (mouthOval.current) {
        const ry = face.mouth === "round" ? 11 : 2 + open * 13;
        mouthOval.current.setAttribute("ry", String(oval ? ry : 0));
        mouthOval.current.setAttribute("rx", String(oval ? (face.mouth === "round" ? 9 : 13) : 0));
      }
      ring.current?.setAttribute("visibility", face.ring ? "visible" : "hidden");
      notepad.current?.setAttribute("visibility", face.notepad ? "visible" : "hidden");
    }

    if (still) {
      // Catch a trigger at its strongest moment.
      const at = still.trigger ? triggerMs[still.trigger] * 0.4 : 0;
      const fired: Fired = still.trigger ? { [still.trigger]: 0 } : {};
      const face = faceFor({ mood: still.mood }, fired, at, still.posture ?? "neutral");
      draw(face, (still.mouthOpen ?? 0) / 100, false, 0);
      return;
    }
    if (!vm) return;

    const fired: Fired = {};
    let posture: Posture = "neutral";
    let open = 0;
    let last = performance.now();
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const stop = vm.onTrigger((name) => {
      fired[name] = performance.now();
      if (name === "sitUp") posture = "firm";
    });

    function tick(now: number) {
      const dt = now - last;
      last = now;
      const { mood, mouthOpen } = vm!.values();
      if (mood === "idle") posture = "neutral";
      if (mood === "intake") posture = "soft";

      const target = mood === "talking" ? mouthOpen / 100 : 0;
      open += (target - open) * (1 - Math.exp(-dt / (target > open ? 40 : 110)));

      draw(faceFor({ mood }, fired, now, posture), open, reduced.matches, now);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      stop();
    };
  }, [vm, still, offline]);

  return (
    <svg
      className={`${styles.meera} ${className ?? ""}`}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      role="img"
      aria-label={offline ? "Meera, offline" : "Meera"}
    >
      <g ref={figure}>
        <path
          d={BODY}
          className={offline ? styles.offlineBody : light ? styles.lightBody : styles.body}
          // A 2 px outline at any size.
          strokeWidth={light ? (2 * 240) / size : undefined}
        />
        <circle
          ref={sun}
          cx="208"
          cy="34"
          r="20"
          className={offline ? styles.offlineSun : styles.sun}
          visibility={light ? "hidden" : undefined}
        />
        {offline ? (
          <g className={styles.offlineEyes}>
            <rect x="70" y="109" width="20" height="6" rx="3" />
            <rect x="124" y="109" width="20" height="6" rx="3" />
          </g>
        ) : (
          <>
            {EYE_X.map((x, index) => (
              <rect
                key={x}
                ref={(node) => {
                  eyes.current[index] = node;
                }}
                x={x - 8}
                y={111}
                width={16}
                height={26}
                rx={8}
                className={styles.eye}
              />
            ))}
            <path ref={mouthLine} className={styles.mouthLine} d="" />
            <ellipse ref={mouthOval} cx="120" cy="158" rx="0" ry="0" className={styles.eye} />
            <path ref={ring} d={RING} transform="translate(0 6)" className={styles.ring} visibility="hidden" />
            <g ref={notepad} visibility="hidden">
              <g transform="translate(132 150) rotate(-8)">
                <rect x="1.5" y="1.5" width="81" height="69" rx="10" className={styles.pad} />
                <rect x="14" y="16" width="56" height="5" rx="2.5" className={styles.padInk} />
                <rect x="14" y="29" width="44" height="5" rx="2.5" className={styles.padLine} />
                <rect x="14" y="42" width="50" height="5" rx="2.5" className={styles.padLine} />
              </g>
              <g transform="translate(196 128) rotate(30)">
                <rect x="2" y="2" width="12" height="48" rx="3" className={styles.pencil} />
                <path d="M2 50l6 12 6-12z" className={styles.pencilTip} />
              </g>
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
