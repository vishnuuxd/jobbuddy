"use client";

import { useEffect, useRef } from "react";

export function SelfView({ stream, className = "self-view" }: { stream: MediaStream | null; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream]);

  if (!stream) return null;

  return <video ref={video} className={className} autoPlay muted playsInline aria-label="Your camera" />;
}
