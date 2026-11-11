// A quiet ringback while Meera's line rings (PRD.md, Call behavior: Ringing): two short rings, then
// a pause, on repeat. It stops the instant she answers. Off with reduced motion. On an iPhone the
// audio session is set to ambient while it rings, so the silent switch mutes it; the session goes
// back to automatic when it stops, so her voice plays as normal.

const RING = { hz: [400, 450], onMs: 400, gapMs: 200, cycleMs: 3000, gain: 0.05 };

type AudioSessionNav = Navigator & { audioSession?: { type: string } };

export function createRingback() {
  let ctx: AudioContext | null = null;
  let timer = 0;
  const session = () => (navigator as AudioSessionNav).audioSession;

  function ring(at: number) {
    if (!ctx) return;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    for (const hz of RING.hz) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      osc.connect(out);
      osc.start(at);
      osc.stop(at + (2 * RING.onMs + RING.gapMs) / 1000);
    }
    // Two rings with a soft attack and release, so they never click.
    for (const start of [0, RING.onMs + RING.gapMs]) {
      const t = at + start / 1000, d = RING.onMs / 1000;
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(RING.gain, t + 0.02);
      out.gain.setValueAtTime(RING.gain, t + d - 0.03);
      out.gain.linearRampToValueAtTime(0, t + d);
    }
  }

  return {
    start() {
      if (ctx || typeof window === "undefined") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      try {
        const s = session();
        if (s) s.type = "ambient";
        ctx = new AudioContext();
        void ctx.resume();
        const loop = () => {
          if (!ctx) return;
          ring(ctx.currentTime + 0.05);
          timer = window.setTimeout(loop, RING.cycleMs);
        };
        loop();
      } catch {
        ctx = null; // No audio: ringing is visual only.
      }
    },
    stop() {
      window.clearTimeout(timer);
      if (ctx) void ctx.close();
      ctx = null;
      const s = session();
      if (s) s.type = "auto";
    },
  };
}
