"use client";

import { useState } from "react";
import ApiImage from "@/components/media/ApiImage";

const tryOnImageClass =
  "absolute inset-0 m-auto h-full w-full object-contain object-center";

type TryOnBeforeAfterProps = {
  beforeSrc: string;
  afterSrc: string;
};

export function TryOnBeforeAfter({ beforeSrc, afterSrc }: TryOnBeforeAfterProps) {
  const [position, setPosition] = useState(52);

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[28px] border border-[#f0dce8] bg-[#f5eef3] shadow-[0_20px_60px_rgba(58,12,82,0.12)]">
      <ApiImage alt="После" className={tryOnImageClass} src={afterSrc} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <ApiImage alt="До" className={tryOnImageClass} src={beforeSrc} />
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
        До
      </span>
      <span className="absolute bottom-4 right-4 rounded-full bg-[linear-gradient(135deg,#ff1fa2,#b100ff)] px-3 py-1 text-xs font-medium text-white">
        После
      </span>
    </div>
  );
}

export function TryOnResultHero({ imageSrc }: { imageSrc: string }) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[32px] border border-[#f0dce8] bg-[#f5eef3] p-2 shadow-[0_28px_70px_rgba(255,31,162,0.14)]">
      <ApiImage
        alt="Результат примерки"
        className="h-full w-full rounded-[26px] object-contain object-center"
        src={imageSrc}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[26px] bg-[linear-gradient(180deg,transparent,rgba(20,16,26,0.55))] px-5 py-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/85">Я на стиле</p>
        <p className="text-lg font-semibold text-white">Твой новый look ✦</p>
      </div>
    </div>
  );
}
