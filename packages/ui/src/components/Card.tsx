import clsx from "clsx";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ elevated = true, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[28px] border border-[#ffd1ed] bg-white/95 p-6",
        elevated &&
          "shadow-[0_20px_60px_rgba(58,12,82,0.14),0_8px_24px_rgba(255,31,162,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
