import styles from "./Meera.module.css";

/**
 * Meera outside the call: her neutral pose as a still image, made by rive/source/build.js from the
 * same parts as the rig (public/meera.svg). No Rive runtime loads here. The call, writing and
 * retry screens use the animated rig (Meera.tsx).
 */
export function MeeraStatic({ size = 64, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a small static SVG, nothing to optimise
    <img src="/meera.svg" width={size} height={size} alt="Meera" className={`${styles.still} ${className ?? ""}`} />
  );
}
