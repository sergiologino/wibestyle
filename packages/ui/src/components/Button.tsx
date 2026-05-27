import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[18px] font-black border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-[transform,opacity,box-shadow] duration-200";

const variants = {
  primary:
    "text-white bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] shadow-[0_12px_34px_rgba(255,31,162,0.38),0_4px_10px_rgba(120,44,255,0.18)] hover:-translate-y-0.5",
  secondary:
    "text-[#ff1fa2] bg-white shadow-[0_10px_30px_rgba(52,7,76,0.12),0_2px_8px_rgba(255,31,162,0.08)] hover:-translate-y-0.5",
  ghost: "text-[#6d6273] bg-transparent hover:text-[#ff1fa2]",
};

const sizes = {
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
