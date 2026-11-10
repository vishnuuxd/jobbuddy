import type { InterviewVM, Viseme } from "../avatar/interviewVM.ts";
import { lipSyncConfig } from "./config.ts";
import { shapeAt, visemeTrack, type Alignment, type Shape } from "./visemes.ts";

// Sets InterviewVM.viseme from her audio as it plays. Each chunk's alignment arrives as the chunk
// starts playing (onAudioAlignmentPlayback), with times relative to that moment, and each chunk
// starts a fresh timeline. lipSync false hands the mouth to the rig's mouthOpen pick: for a chunk
// with no letters, a shape held past maxHoldMs, or a timeline that stalled.

export type LipSync = {
  /** A chunk of her audio has started playing. Starts a fresh timeline. */
  chunk: (alignment: Alignment | undefined) => void;
  /** Call every frame while she may be speaking. */
  tick: () => void;
  /** Her audio stopped: end of turn, cut off, call ended, tab hidden. The mouth rests now. */
  stop: () => void;
};

export function createLipSync(vm: InterviewVM, clock: () => number = () => performance.now(), timing = lipSyncConfig): LipSync {
  let track: Shape[] = [];
  let startedAt = 0;
  let lastTick = 0;

  const set = (viseme: Viseme, lipSync: boolean) => {
    const now = vm.values();
    if (now.viseme !== viseme || now.lipSync !== lipSync) vm.set({ viseme, lipSync });
  };
  const drop = () => {
    track = [];
    set("rest", false);
  };

  return {
    chunk(alignment) {
      startedAt = lastTick = clock();
      track = alignment ? visemeTrack(alignment, timing) : [];
      if (!track.length) return drop();
      const s = shapeAt(track, 0);
      set(s?.viseme ?? "rest", true);
    },
    tick() {
      const now = clock();
      const gap = now - lastTick;
      lastTick = now;
      if (!track.length) return;
      // Frames stalled: playback has moved on without us. Wait for the next chunk.
      if (gap > timing.stallMs) return drop();
      const ms = now - startedAt;
      // Past the last letter: the mouth rests, and mouthOpen takes over if more audio plays.
      if (ms > track[track.length - 1].end) return drop();
      const s = shapeAt(track, ms);
      if (!s) return set("rest", true);
      // No new letter for too long: let mouthOpen move the mouth until the next shape.
      if (ms - s.start > timing.maxHoldMs) return set(s.viseme, false);
      set(s.viseme, true);
    },
    stop() {
      drop();
    },
  };
}
