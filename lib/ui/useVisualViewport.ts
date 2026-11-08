"use client";

import { useEffect, useState } from "react";

/**
 * How much of the layout viewport the on-screen keyboard covers, in px.
 * iOS Safari doesn't resize the layout for the keyboard, so fixed sheets read this to stay above it.
 */
export function useKeyboardInset(active = true) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;

    const update = () => {
      setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);

  return inset;
}
