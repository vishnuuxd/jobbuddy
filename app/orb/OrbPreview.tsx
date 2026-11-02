"use client";

import { useEffect, useRef, useState } from "react";
import { MeeraStage } from "@/components/MeeraStage";
import { createInterviewVM, moods, triggers, type Mood, type Trigger } from "@/lib/avatar/interviewVM";
import { drawOrb, posedWithTriggers, restingPose, triggerMs, type Posture } from "@/lib/avatar/orbDraw";

type Still = { label: string; mood: Mood; posture?: Posture; mouth?: number; trigger?: Trigger; at?: number };

// Each trigger is caught near its strongest moment.
const stills: Still[] = [
  { label: "idle", mood: "idle" },
  { label: "listening", mood: "listening", posture: "firm" },
  { label: "intake", mood: "intake", posture: "soft" },
  { label: "talking, quiet", mood: "talking", posture: "firm", mouth: 0.3 },
  { label: "talking, loud", mood: "talking", posture: "firm", mouth: 0.95 },
  { label: "skeptical", mood: "skeptical", posture: "firm" },
  { label: "writing", mood: "writing", posture: "firm" },
  { label: "reading", mood: "reading", posture: "firm" },
  { label: "nod", mood: "listening", posture: "firm", trigger: "nod", at: 0.2 },
  { label: "smile", mood: "listening", posture: "firm", trigger: "smile", at: 0.5 },
  { label: "browRaise", mood: "listening", posture: "firm", trigger: "browRaise", at: 0.02 },
  { label: "glanceDown", mood: "listening", posture: "firm", trigger: "glanceDown", at: 0.5 },
  { label: "handUp", mood: "listening", posture: "firm", trigger: "handUp", at: 0.5 },
  { label: "checkWatch", mood: "listening", posture: "firm", trigger: "checkWatch", at: 0.3 },
  { label: "sitUp", mood: "listening", posture: "firm", trigger: "sitUp", at: 0.5 },
  { label: "leanIn", mood: "listening", posture: "firm", trigger: "leanIn", at: 0.5 },
  { label: "expectant", mood: "listening", posture: "firm", trigger: "expectant", at: 0.5 },
];

function StillOrb({ still }: { still: Still }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;
    const scale = window.devicePixelRatio || 1;
    element.width = element.clientWidth * scale;
    element.height = element.clientHeight * scale;

    const { mood, posture = "neutral", mouth = 0, trigger, at = 0 } = still;
    const fired = trigger ? { [trigger]: -at * triggerMs[trigger] } : {};
    drawOrb(ctx, element.width, element.height, {
      ...posedWithTriggers(restingPose(mood, posture), fired, 0),
      mouth,
      seconds: 1.3,
    });
  }, [still]);

  return (
    <figure>
      <canvas ref={canvas} />
      <figcaption>{still.label}</figcaption>
    </figure>
  );
}

// A preview of every orb state. It only sets InterviewVM values, like the call does.
export function OrbPreview() {
  const [vm] = useState(createInterviewVM);
  const [mood, setMood] = useState<Mood>("listening");
  const [loud, setLoud] = useState(false);

  useEffect(() => vm.set({ mood }), [vm, mood]);

  useEffect(() => {
    if (!loud) return;
    const timer = setInterval(() => {
      vm.set({ mouthOpen: 35 + Math.abs(Math.sin(Date.now() / 170)) * 60 });
    }, 50);
    return () => {
      clearInterval(timer);
      vm.set({ mouthOpen: 0 });
    };
  }, [vm, loud]);

  return (
    <main className="orb-preview">
      <div className="orb-live">
        <MeeraStage vm={vm} />
      </div>
      <section className="orb-group">
        <h2>Mood</h2>
        <div>
          {moods.map((name) => (
            <button key={name} aria-pressed={mood === name} onClick={() => setMood(name)}>
              {name}
            </button>
          ))}
          <button aria-pressed={loud} onClick={() => setLoud(!loud)}>
            voice volume
          </button>
        </div>
      </section>
      <section className="orb-group">
        <h2>Triggers</h2>
        <div>
          {triggers.map((name) => (
            <button key={name} onClick={() => vm.fire(name)}>
              {name}
            </button>
          ))}
        </div>
      </section>
      <section className="orb-sheet">
        {stills.map((still) => (
          <StillOrb key={still.label} still={still} />
        ))}
      </section>
    </main>
  );
}
