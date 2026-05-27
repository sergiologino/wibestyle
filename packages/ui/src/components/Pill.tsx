import clsx from "clsx";
import type { HTMLAttributes } from "react";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "brand" | "soft";
};

export function Pill({ tone = "brand", className, ...props }: PillProps) {
  return (
    <span
      className={clsx(
        "inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-black tracking-tight",
        tone === "brand"
          ? "bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] text-white shadow-[0_12px_34px_rgba(255,31,162,0.28)]"
          : "bg-[#fff4fb] text-[#ff1fa2] border border-[#ffd1ed]",
        className,
      )}
      {...props}
    />
  );
}
