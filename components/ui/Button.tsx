import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ink" | "text";
export type ButtonSize = "big" | "small" | "compact";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** On ink screens: white outline and white shadow. */
  onDark?: boolean;
  loading?: boolean;
  /** Stretch to the width of its container. */
  block?: boolean;
  children: ReactNode;
  className?: string;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common> & { href: string };

export function buttonClass({
  variant = "primary",
  size = "big",
  onDark = false,
  block = false,
  className,
}: Pick<Common, "variant" | "size" | "onDark" | "block" | "className">) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    onDark && styles.onDark,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Label({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return (
    <>
      <span className={loading ? styles.hiddenLabel : undefined}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </>
  );
}

export function Button(props: AsButton | AsLink) {
  const { variant, size, onDark, loading, block, className, children, ...rest } = props;
  const cls = buttonClass({ variant, size, onDark, block, className });

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, keyof Common>)} className={cls}>
        <Label>{children}</Label>
      </Link>
    );
  }

  const { disabled, type = "button", onClick, ...buttonRest } = rest as Omit<AsButton, keyof Common>;
  return (
    <button
      {...buttonRest}
      type={type}
      className={cls}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
    >
      <Label loading={loading}>{children}</Label>
    </button>
  );
}
