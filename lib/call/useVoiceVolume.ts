"use client";

import { useEffect, useRef } from "react";
import type { InterviewVM } from "@/lib/avatar/interviewVM";
import { liveConfig } from "@/lib/live/config";

// Feeds her voice volume into mouthOpen while lip sync is out of v1.
export function useVoiceVolume(vm: InterviewVM, getVolume: () => number, active: boolean) {
  const latestGetVolume = useRef(getVolume);
  latestGetVolume.current = getVolume;

  useEffect(() => {
    if (!active) return;
    let frame = 0;

    function tick() {
      vm.set({ mouthOpen: latestGetVolume.current() * liveConfig.mouthOpenGain });
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      vm.set({ mouthOpen: 0 });
    };
  }, [vm, active]);
}
