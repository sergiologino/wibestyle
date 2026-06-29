import clsx from "clsx";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ elevated = true, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[28px] border border-[var(--pink-soft)] bg-white/95 p-6",
        elevated && "shadow-xl",
        className,
      )}
      {...props}
    />
  );
}
