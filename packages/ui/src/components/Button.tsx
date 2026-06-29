import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const base =
  "inline-flex max-w-full items-center justify-center gap-1.5 rounded-2xl border-0 font-medium leading-snug text-center transition-[transform,opacity,background-color,box-shadow] duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97] disabled:active:scale-100";

const variants = {
  primary: "bg-[var(--pink)] text-white shadow-lg hover:bg-[var(--pink-dark)]",
  secondary: "border border-[var(--pink-soft)] bg-white text-[var(--pink)] shadow-sm hover:bg-[var(--pink-bg)]",
  ghost: "bg-transparent text-[var(--muted)] hover:bg-[var(--pink-bg)] hover:text-[var(--pink)]",
};

const sizes = {
  sm: "min-h-8 px-3 py-1.5 text-xs",
  md: "min-h-9 px-4 py-2 text-sm",
  lg: "min-h-10 px-5 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
