"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The self view is only shown to me. No frame leaves the device.
export function useSelfView() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const toggle = useCallback(async () => {
    if (streamRef.current) {
      stop();
      return;
    }

    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = next;
      setStream(next);
    } catch {
      // Camera denied: the tile stays off and the call carries on.
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { stream, isOn: stream !== null, toggle, stop };
}
