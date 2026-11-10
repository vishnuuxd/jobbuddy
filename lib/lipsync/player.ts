import type { InterviewVM } from "../avatar/interviewVM.ts";
import { lipSyncConfig } from "./config.ts";
import { visemeAt, visemeTrack, type Alignment, type Shape } from "./visemes.ts";

// Sets InterviewVM.viseme from her audio as it plays. Each chunk's alignment arrives as the chunk
// starts playing (onAudioAlignmentPlayback), with times relative to that moment. A chunk with no
// alignment sets lipSync false, and the rig picks the mouth from mouthOpen until one with letters plays.

export type LipSync = {
  /** A chunk of her audio has started playing. */
  chunk: (alignment: Alignment | undefined) => void;
  /** Call every frame while she may be speaking. */
  tick: () => void;
  /** She stopped or was cut off: the mouth rests. */
  stop: () => void;
};

export function createLipSync(vm: InterviewVM, clock: () => number = () => performance.now(), timing = lipSyncConfig): LipSync {
  let track: Shape[] = [];
  let startedAt = 0;

  const set = (viseme: ReturnType<typeof visemeAt>, lipSync: boolean) => {
    const now = vm.values();
    if (now.viseme !== viseme || now.lipSync !== lipSync) vm.set({ viseme, lipSync });
  };

  return {
    chunk(alignment) {
      startedAt = clock();
      track = alignment ? visemeTrack(alignment, timing) : [];
      if (!track.length) set("rest", false);
      else set(visemeAt(track, 0), true);
    },
    tick() {
      if (!track.length) return;
      const ms = clock() - startedAt;
      // Past the last letter: hand back to mouthOpen, in case more audio plays without alignment.
      if (ms > track[track.length - 1].end + timing.leadMs) {
        track = [];
        set("rest", false);
        return;
      }
      set(visemeAt(track, ms), true);
    },
    stop() {
      track = [];
      set("rest", false);
    },
  };
}
