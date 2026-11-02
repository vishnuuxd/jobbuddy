type Props = {
  muted: boolean;
  cameraOn: boolean;
  onToggleMute: () => void;
  onAttach: () => void;
  onToggleCamera: () => void;
  onHangUp: () => void;
};

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CallControls({
  muted,
  cameraOn,
  onToggleMute,
  onAttach,
  onToggleCamera,
  onHangUp,
}: Props) {
  return (
    <div className="controls">
      <button
        className="control"
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        onClick={onToggleMute}
      >
        <svg {...iconProps} aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          {muted && <path d="M4 4l16 16" />}
        </svg>
      </button>

      <button className="control" aria-label="Attach a CV or job description" onClick={onAttach}>
        <svg {...iconProps} aria-hidden="true">
          <path d="M20 11.5l-8.1 8.1a5 5 0 0 1-7-7l8.4-8.4a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.3-2.3l7.7-7.7" />
        </svg>
      </button>

      <button
        className="control"
        aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
        aria-pressed={cameraOn}
        onClick={onToggleCamera}
      >
        <svg {...iconProps} aria-hidden="true">
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="M16 10l5-3v10l-5-3" />
        </svg>
      </button>

      <button className="control hang-up" aria-label="Hang up" onClick={onHangUp}>
        <svg {...iconProps} width={26} height={26} aria-hidden="true">
          <path d="M3 14.5c5-5 13-5 18 0l-2.4 2.4-3.3-1.6v-2.7c-2-.6-4.6-.6-6.6 0v2.7l-3.3 1.6z" />
        </svg>
      </button>
    </div>
  );
}
