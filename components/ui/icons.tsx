// Icons. Stroke and fill come from currentColor or props, so one shape serves light and plum screens.
type IconProps = { active?: boolean; size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
});

// Tab icons follow the text colour: muted, or white inside the active plum pill.
const tabStroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function HomeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" {...tabStroke} />
    </svg>
  );
}

export function HistoryIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" {...tabStroke} />
      <path d="M12 7.5V12l3 2" {...tabStroke} />
    </svg>
  );
}

export function ProfileIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8.5" r="3.8" {...tabStroke} />
      <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" {...tabStroke} />
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

const lineIcon = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" {...lineIcon} strokeWidth="2.2" />
    </svg>
  );
}

/** The streak flame from Plum Home. */
export function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c3 4 6 6.5 6 10.5A6 6 0 0 1 6 13.5c0-2 1-3.5 2.5-5 .5 2 1.5 3 3 3-1-3 0-6 .5-8.5z" {...lineIcon} strokeWidth="2.2" />
    </svg>
  );
}

export function StarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 3l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L14 19.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z" {...lineIcon} strokeWidth="2.2" />
    </svg>
  );
}

/** Badges, from the Plum retry header. */
export function MedalIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="6" {...lineIcon} strokeWidth="2" />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" {...lineIcon} strokeWidth="2" />
    </svg>
  );
}

export function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...lineIcon} strokeWidth="2.2" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" {...lineIcon} strokeWidth="2.4" />
    </svg>
  );
}

export function BackIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" {...lineIcon} strokeWidth="2.4" />
    </svg>
  );
}
