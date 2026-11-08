"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useKeyboardInset } from "@/lib/ui/useVisualViewport";
import styles from "./Sheet.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Read by screen readers. Shown only if `showTitle` is set. */
  title: string;
  showTitle?: boolean;
  children: ReactNode;
};

/**
 * Bottom sheet on a native modal dialog: focus stays inside, Escape closes it,
 * and the page behind can't be reached. A tap on the pink backdrop closes it too.
 */
export function Sheet({ open, onClose, title, showTitle, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const keyboard = useKeyboardInset(open);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => {
    const root = document.documentElement;
    if (!open) return;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby={titleId}
      style={{ "--keyboard": `${keyboard}px` } as React.CSSProperties}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.grabber} aria-hidden="true" />
        <h2 id={titleId} className={showTitle ? styles.title : "visually-hidden"}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
