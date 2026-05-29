"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type FeedbackState = "idle" | "loading" | "success";

type FeedbackActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  feedbackState: FeedbackState;
  variant?: "primary" | "secondary";
  successLabel?: string;
  children: ReactNode;
};

const variants = {
  primary:
    "bg-[#ff1fa2] text-white shadow-[0_8px_24px_rgba(255,31,162,0.22)] hover:bg-[#eb1692] active:scale-[0.97]",
  secondary:
    "border border-[#ffd1ed] bg-white text-[#ff1fa2] shadow-[0_6px_18px_rgba(58,12,82,0.06)] hover:bg-[#fff8fd] active:scale-[0.97]",
};

export default function FeedbackActionButton({
  feedbackState,
  variant = "primary",
  successLabel = "Готово!",
  className,
  disabled,
  children,
  ...props
}: FeedbackActionButtonProps) {
  const isSuccess = feedbackState === "success";
  const isLoading = feedbackState === "loading";

  return (
    <button
      type="button"
      className={clsx(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isSuccess
          ? "scale-[1.02] bg-[#782cff] text-white shadow-[0_10px_28px_rgba(120,44,255,0.35)]"
          : variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {isSuccess ? (
        <span aria-hidden className="animate-[bounceIn_0.45s_ease-out] text-base leading-none">
          ✓
        </span>
      ) : null}
      <span className={clsx("transition-opacity duration-200", isLoading && "opacity-90")}>
        {isSuccess ? successLabel : children}
      </span>
    </button>
  );
}
