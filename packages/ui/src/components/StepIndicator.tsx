"use client";

import clsx from "clsx";

type StepIndicatorProps = {
  steps: string[];
  current: number;
};

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li
            key={label}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-black transition-[transform,opacity,box-shadow] duration-200",
              active &&
                "bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] text-white shadow-[0_10px_28px_rgba(255,31,162,0.28)]",
              done && !active && "bg-[#fff4fb] text-[#ff1fa2] border border-[#ffd1ed]",
              !active && !done && "bg-white text-[#6d6273] border border-[#f0d4ea]",
            )}
          >
            {index + 1}. {label}
          </li>
        );
      })}
    </ol>
  );
}
