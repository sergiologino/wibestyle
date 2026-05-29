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
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
              active && "bg-[#ff1fa2] text-white",
              done && !active && "border border-[#ffd1ed] bg-[#fff4fb] text-[#ff1fa2]",
              !active && !done && "border border-[#f0d4ea] bg-white text-[#6d6273]",
            )}
          >
            {index + 1}. {label}
          </li>
        );
      })}
    </ol>
  );
}
