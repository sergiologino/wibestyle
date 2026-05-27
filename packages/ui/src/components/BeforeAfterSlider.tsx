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
      <span className="absolute left-4 bottom-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#ff1fa2] shadow-[0_8px_20px_rgba(52,7,76,0.12)]">
        {beforeLabel}
      </span>
      <span className="absolute right-4 bottom-4 rounded-full bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] px-3 py-1 text-xs font-black text-white shadow-[0_8px_20px_rgba(255,31,162,0.28)]">
        {afterLabel}
      </span>
    </div>
  );
}
