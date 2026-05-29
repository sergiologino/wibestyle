import clsx from "clsx";
import type { HTMLAttributes } from "react";

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "brand" | "soft";
};

export function Pill({ tone = "brand", className, ...props }: PillProps) {
  return (
    <span
      className={clsx(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        tone === "brand"
          ? "bg-[#ff1fa2] text-white"
          : "border border-[#ffd1ed] bg-[#fff4fb] text-[#ff1fa2]",
        className,
      )}
      {...props}
    />
  );
}
