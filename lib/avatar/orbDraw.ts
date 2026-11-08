import type { Mood, Trigger } from "./interviewVM";

// How the orb shows InterviewVM values, per the table in PRD.md. Pure drawing:
// no timers and no app state, so any moment can be rendered on its own.
export type Posture = "neutral" | "soft" | "firm";
export type Fired = Partial<Record<Trigger, number>>;

export type Pose = {
  scale: number;
  lift: number; // In radii, up is negative
  stretch: number; // Above 0 is taller, below 0 is wider
  soft: number;
  dim: number;
  bright: number;
  warm: number;
  cool: number;
  ripple: number;
};

const postures: Record<Posture, Pick<Pose, "scale" | "soft">> = {
  neutral: { scale: 1, soft: 0.45 },
  soft: { scale: 0.88, soft: 1 },
  firm: { scale: 1.07, soft: 0 },
};

export function restingPose(mood: Mood, posture: Posture): Pose {
  const pose: Pose = {
    ...postures[posture],
    lift: 0,
    stretch: 0,
    dim: 0,
    bright: 0,
    warm: 0,
    cool: 0,
    ripple: 0,
  };
  if (mood === "writing") pose.ripple = 1;
  if (mood === "skeptical") {
    pose.stretch = 0.05;
    pose.cool = 0.7;
  }
  return pose;
}

export const blendPose = (from: Pose, to: Pose, amount: number) =>
  Object.fromEntries(
    (Object.keys(to) as (keyof Pose)[]).map((key) => [key, from[key] + (to[key] - from[key]) * amount]),
  ) as Pose;

export const triggerMs: Record<Trigger, number> = {
  nod: 480,
  smile: 1000,
  browRaise: 300,
  glanceDown: 1700,
  handUp: 900,
  checkWatch: 1300,
  sitUp: 500,
  leanIn: 1700,
  expectant: 2500,
};

// Rises, holds, falls.
function hold(ms: number, total: number, rise = 180, fall = 320) {
  return Math.max(0, Math.min(1, ms / rise, (total - ms) / fall));
}

function applyTrigger(pose: Pose, name: Trigger, ms: number) {
  const total = triggerMs[name];
  const held = hold(ms, total);
  const progress = ms / total;

  switch (name) {
    case "nod":
      pose.lift += Math.sin(progress * Math.PI * 2) * (1 - progress) * 0.13;
      break;
    case "smile":
      pose.warm += held;
      pose.stretch -= held * 0.05;
      break;
    case "browRaise":
      pose.scale += Math.exp(-ms / 70) * 0.13;
      break;
    case "glanceDown":
      pose.scale -= held * 0.08;
      pose.dim += held * 0.4;
      pose.lift += held * 0.06;
      break;
    case "handUp":
      pose.stretch += held * 0.1;
      pose.lift -= held * 0.05;
      break;
    case "sitUp":
      pose.scale += Math.sin(progress * Math.PI) * 0.05;
      break;
    case "leanIn":
      pose.scale += held * 0.14;
      break;
    case "expectant":
      pose.lift -= held * 0.08;
      pose.bright += held * 0.8;
      break;
    case "checkWatch":
      break; // Drawn as the ring.
  }
}

export function posedWithTriggers(base: Pose, fired: Fired, now: number) {
  const pose = { ...base };
  let ring: number | null = null;

  for (const name of Object.keys(fired) as Trigger[]) {
    const ms = now - fired[name]!;
    if (ms < 0 || ms > triggerMs[name]) continue;
    applyTrigger(pose, name, ms);
    if (name === "checkWatch") ring = ms / triggerMs.checkWatch;
  }
  return { pose, ring };
}

function radialOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  alpha: number,
) {
  if (alpha <= 0) return;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${rgb},${alpha})`);
  glow.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawOrb(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  { pose, ring, mouth, seconds }: { pose: Pose; ring: number | null; mouth: number; seconds: number },
) {
  const unit = Math.min(width, height) * 0.3;
  const x = width / 2;
  const y = height / 2 + pose.lift * unit;
  const breath = 1 + Math.sin((seconds * Math.PI * 2) / 4.6) * 0.022 * (1 - mouth);
  const radius = unit * pose.scale * breath * (1 + mouth * 0.14);
  const wobble = 0.006 + mouth * 0.085;

  ctx.clearRect(0, 0, width, height);

  const blob = new Path2D();
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    const wave =
      Math.sin(a * 3 + seconds * 2.3) * 0.5 +
      Math.sin(a * 5 - seconds * 3.1) * 0.3 +
      Math.sin(a * 2 + seconds * 1.7) * 0.4;
    const r = radius * (1 + wobble * wave);
    const px = x + Math.cos(a) * r * (1 - pose.stretch);
    const py = y + Math.sin(a) * r * (1 + pose.stretch);
    if (i === 0) blob.moveTo(px, py);
    else blob.lineTo(px, py);
  }
  blob.closePath();

  const shade = ctx.createRadialGradient(
    x - radius * 0.34,
    y - radius * 0.42,
    radius * 0.04,
    x,
    y,
    radius * 1.2,
  );
  shade.addColorStop(0, "#b7d6e6");
  shade.addColorStop(0.45, "#4f86ad");
  shade.addColorStop(1, "#14283a");

  // A wide halo softens the edge. Canvas blur filters don't run on iOS Safari.
  ctx.save();
  ctx.shadowColor = `rgba(79,134,173,${0.3 + pose.soft * 0.35 + pose.bright * 0.3})`;
  ctx.shadowBlur = unit * (0.04 + pose.soft * 0.5 + pose.bright * 0.35);
  ctx.fillStyle = shade;
  ctx.fill(blob);
  ctx.restore();

  ctx.save();
  ctx.clip(blob);
  const reach = radius * 1.5;
  const veil = pose.soft * 0.22 + pose.dim * 0.65;
  if (veil > 0) {
    ctx.fillStyle = `rgba(221,227,230,${veil})`;
    ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);
  }
  if (pose.cool > 0) {
    ctx.fillStyle = `rgba(81,98,111,${pose.cool * 0.55})`;
    ctx.fillRect(x - reach, y - reach, reach * 2, reach * 2);
  }
  radialOverlay(ctx, x, y - radius * 0.2, reach, "255,255,255", pose.bright * 0.45);
  radialOverlay(ctx, x, y + radius * 0.3, reach, "240,164,92", pose.warm * 0.8);

  for (let i = 0; i < 3 && pose.ripple > 0.01; i++) {
    const progress = (seconds / 2.1 + i / 3) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(1 - progress) * 0.5 * pose.ripple})`;
    ctx.lineWidth = unit * 0.016;
    ctx.beginPath();
    ctx.arc(x, y, progress * radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  if (ring !== null) {
    const head = -Math.PI / 2 + Math.PI * 2 * (1 - (1 - ring) ** 2);
    const fade = Math.min(1, (1 - ring) / 0.2);
    ctx.lineCap = "round";
    ctx.lineWidth = unit * 0.035;
    for (let i = 0; i < 24; i++) {
      const start = head - (i + 1) * 0.06;
      ctx.strokeStyle = `rgba(20,40,58,${(1 - i / 24) * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.17, start, start + 0.07);
      ctx.stroke();
    }
  }
}
