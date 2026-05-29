"use client";

import { useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "До",
  afterLabel = "После",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(52);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-[#ffd1ed] shadow-[0_20px_60px_rgba(58,12,82,0.14),0_8px_24px_rgba(255,31,162,0.08)]">
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_18px_rgba(255,31,162,0.55)]"
        style={{ left: `calc(${position}% - 2px)` }}
      />
      <input
        aria-label="Сравнение до и после"
        className="absolute inset-0 z-10 w-full cursor-ew-resize opacity-0"
        max={100}
        min={0}
        type="range"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
      <span className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-[#ff1fa2]">
        {beforeLabel}
      </span>
      <span className="absolute bottom-4 right-4 rounded-full bg-[#ff1fa2] px-3 py-1 text-xs font-medium text-white">
        {afterLabel}
      </span>
    </div>
  );
}
