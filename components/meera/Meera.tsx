"use client";

import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";
import { useEffect } from "react";
import type { InterviewVM, Mood, Trigger } from "@/lib/avatar/interviewVM";
import type { Posture } from "@/lib/avatar/meeraFace";
import styles from "./Meera.module.css";

/** A set moment, for previews: she settles into it and stays there, still breathing and blinking. */
export type MeeraStill = { mood: Mood; trigger?: Trigger; mouthOpen?: number; posture?: Posture };

type Props = {
  vm?: InterviewVM;
  still?: MeeraStill;
  /** Rendered width and height in px. */
  size?: number;
  /** Not connected: she rests, greyed out. A display state, not an InterviewVM value. */
  offline?: boolean;
  className?: string;
};

// The rig: rive/meera.riv, built by `npm run rig` and served from public/.
const SRC = "/rive/meera.riv";
const ARTBOARD = { width: 400, height: 440 };
// Below this size, show her head (the reference tiles' 240 px square from 80, 40), not the whole bust.
const HEAD_ONLY_BELOW = 160;
const HEAD = { x: 80, y: 40, size: 240 };

/** Meera's Rive rig. Reads InterviewVM only: the app never animates her, it sets values. */
export function Meera({ vm, still, size = 240, offline = false, className }: Props) {
  const { rive, RiveComponent } = useRive({
    src: SRC,
    artboard: "Meera",
    stateMachine: "InterviewVM",
    autoplay: true,
    autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  const stillKey = still ? JSON.stringify(still) : "";

  useEffect(() => {
    const vmi = rive?.viewModelInstance;
    if (!rive || !vmi) return;
    const mood = vmi.enum("mood");
    const viseme = vmi.enum("viseme");
    const mouthOpen = vmi.number("mouthOpen");
    const lipSync = vmi.boolean("lipSync");
    const reducedMotion = vmi.boolean("reducedMotion");
    const fire = (name: Trigger) => vmi.trigger(name)?.trigger();

    // Reduced motion follows the phone's setting, like offline follows the connection.
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (reducedMotion) reducedMotion.value = media.matches;
    };
    syncMotion();
    media.addEventListener("change", syncMotion);
    const cleanups: (() => void)[] = [() => media.removeEventListener("change", syncMotion)];

    if (offline || still) {
      const moment: MeeraStill = offline ? { mood: "idle" } : still!;
      if (mood) mood.value = moment.mood;
      if (mouthOpen) mouthOpen.value = moment.mouthOpen ?? 0;
      if (viseme) viseme.value = "rest";
      if (lipSync) lipSync.value = false;
      if (moment.posture === "firm") fire("sitUp");
      if (moment.trigger) fire(moment.trigger);
      rive.play();
    } else if (vm) {
      // Copy InterviewVM into the rig whenever a value changes, and pass triggers straight through.
      let last: { mood: string; viseme: string; mouthOpen: number; lipSync: boolean | null } = { mood: "", viseme: "", mouthOpen: -1, lipSync: null };
      let frame = requestAnimationFrame(function sync() {
        const v = vm.values();
        if (mood && v.mood !== last.mood) mood.value = v.mood;
        if (viseme && v.viseme !== last.viseme) viseme.value = v.viseme;
        if (mouthOpen && v.mouthOpen !== last.mouthOpen) mouthOpen.value = v.mouthOpen;
        if (lipSync && v.lipSync !== last.lipSync) lipSync.value = v.lipSync;
        last = { ...v };
        frame = requestAnimationFrame(sync);
      });
      const stop = vm.onTrigger(fire);
      rive.play();
      cleanups.push(() => cancelAnimationFrame(frame), stop);
    }
    return () => cleanups.forEach((done) => done());
  }, [rive, vm, stillKey, offline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Large: the whole bust, fitted into the square. Small: the canvas is scaled so her head fills it.
  const headOnly = size < HEAD_ONLY_BELOW;
  const k = size / HEAD.size;
  const canvas = headOnly
    ? { width: ARTBOARD.width * k, height: ARTBOARD.height * k, left: -HEAD.x * k, top: -HEAD.y * k }
    : { width: size, height: size, left: 0, top: 0 };

  return (
    <div
      className={`${styles.meera} ${headOnly ? styles.head : ""} ${offline ? styles.offline : ""} ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={offline ? "Meera, offline" : "Meera"}
    >
      <div className={styles.canvas} style={canvas}>
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
