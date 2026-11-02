"use client";

import { useEffect, useRef } from "react";
import type { InterviewVM } from "@/lib/avatar/interviewVM";
import {
  blendPose,
  drawOrb,
  posedWithTriggers,
  restingPose,
  type Fired,
  type Posture,
} from "@/lib/avatar/orbDraw";

const easeToward = (dt: number, ms: number) => 1 - Math.exp(-dt / ms);

// The v1 stand-in for Meera. It reads InterviewVM and nothing else.
export function Orb({ vm }: { vm: InterviewVM }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;

    const fired: Fired = {};
    let posture: Posture = "neutral";
    let pose = restingPose(vm.values().mood, posture);
    let mouth = 0;
    let last = performance.now();
    let frame = 0;

    const stopListening = vm.onTrigger((name) => {
      fired[name] = performance.now();
      if (name === "sitUp") posture = "firm";
    });

    function fit() {
      const scale = window.devicePixelRatio || 1;
      element!.width = Math.round(element!.clientWidth * scale);
      element!.height = Math.round(element!.clientHeight * scale);
    }
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();

    function tick(now: number) {
      const dt = now - last;
      last = now;
      const { mood, mouthOpen } = vm.values();
      if (mood === "idle") posture = "neutral";
      if (mood === "intake") posture = "soft";

      const target = Math.pow(mouthOpen / 100, 0.8);
      mouth += (target - mouth) * easeToward(dt, target > mouth ? 40 : 130);
      pose = blendPose(pose, restingPose(mood, posture), easeToward(dt, 220));

      drawOrb(ctx!, element!.width, element!.height, {
        ...posedWithTriggers(pose, fired, now),
        mouth,
        seconds: now / 1000,
      });
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      stopListening();
    };
  }, [vm]);

  return <canvas ref={canvas} className="orb" />;
}
