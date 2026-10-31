"use client";

import { useEffect, useRef } from "react";

export function SelfView({ stream }: { stream: MediaStream | null }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream]);

  if (!stream) return null;

  return <video ref={video} className="self-view" autoPlay muted playsInline aria-label="Your camera" />;
}
