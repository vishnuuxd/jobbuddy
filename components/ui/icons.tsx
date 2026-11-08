// Icons from the Paper file. Stroke and fill come from props so one shape serves light and ink screens.
type IconProps = { active?: boolean; size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
});

export function HomeIcon({ active, size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"
        fill={active ? "var(--pink)" : "none"}
        stroke={active ? "var(--ink)" : "var(--muted)"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryIcon({ active, size = 24 }: IconProps) {
  const stroke = active ? "var(--ink)" : "var(--muted)";
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" fill={active ? "var(--pink)" : "none"} stroke={stroke} strokeWidth="2" />
      <path d="M12 7.5V12l3 2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileIcon({ active, size = 24 }: IconProps) {
  const stroke = active ? "var(--ink)" : "var(--muted)";
  const fill = active ? "var(--pink)" : "none";
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8.5" r="3.8" fill={fill} stroke={stroke} strokeWidth="2" />
      <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3z" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const callStroke = { stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MicIcon({ off, size = 24 }: { off?: boolean; size?: number }) {
  return (
    <svg {...base(size)}>
      <rect x="9" y="3" width="6" height="11" rx="3" {...callStroke} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...callStroke} />
      {off && <path d="M4 4l16 16" {...callStroke} />}
    </svg>
  );
}

export function AttachIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...base(size)}>
      <path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" {...callStroke} />
    </svg>
  );
}

export function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="6" width="13" height="12" rx="2" {...callStroke} />
      <path d="M16 10l5-3v10l-5-3" {...callStroke} />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M7 1.5c2 2.6 3.8 4.2 3.8 6.6A3.8 3.8 0 0 1 3.2 8.1c0-1.4.8-2.4 1.6-3.2.2 1.2.8 1.8 1.4 2 0-2 .2-3.6.8-5.4z"
        fill="var(--white)"
      />
    </svg>
  );
}

export function StarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 3l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L14 19.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"
        fill="var(--mint)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
