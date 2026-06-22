"use client";

import { useState } from "react";
import clsx from "clsx";
import ApiImage from "@/components/media/ApiImage";
import AuthenticatedVideo from "@/components/media/AuthenticatedVideo";

const tryOnImageClass =
  "absolute inset-0 m-auto h-full w-full object-contain object-center";

const mediaFrameClass =
  "relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-[#f0dce8] bg-[#f5eef3] shadow-[0_20px_60px_rgba(58,12,82,0.12)]";

type TryOnBeforeAfterProps = {
  beforeSrc: string;
  afterSrc: string;
  onExpandClick?: () => void;
  className?: string;
};

export function TryOnBeforeAfter({ beforeSrc, afterSrc, onExpandClick, className }: TryOnBeforeAfterProps) {
  const [position, setPosition] = useState(52);

  return (
    <div className={clsx("relative w-full", className)}>
      <div className={mediaFrameClass}>
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
        <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-medium leading-4 text-[#ff1fa2] shadow-sm sm:bottom-4 sm:left-4 sm:px-3 sm:py-1 sm:text-xs sm:leading-normal">
          До
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-[#ff1fa2] px-2 py-0.5 text-[10px] font-medium leading-4 text-white shadow-sm sm:bottom-4 sm:right-4 sm:px-3 sm:py-1 sm:text-xs sm:leading-normal">
          После
        </span>
      </div>

      {onExpandClick ? (
        <button
          aria-label="Увеличить"
          className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/95 text-base text-[#302637] shadow-md transition hover:bg-white hover:text-[#ff1fa2]"
          type="button"
          onClick={onExpandClick}
        >
          ⤢
        </button>
      ) : null}
    </div>
  );
}

type TryOnResultVideoProps = {
  src: string;
  eliteFrame?: boolean;
  className?: string;
};

export function TryOnResultVideo({ src, eliteFrame = false, className }: TryOnResultVideoProps) {
  return (
    <div className={clsx("relative w-full", className)}>
      <div
        className={clsx(
          mediaFrameClass,
          eliteFrame ? "border-[#ffb347]" : "border-[#f0dce8]",
        )}
      >
        <AuthenticatedVideo autoPlay className="h-full w-full object-cover" loop muted src={src} />
        <span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-medium leading-4 text-[#782cff] shadow-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs sm:leading-normal">
          Видео
        </span>
        {eliteFrame ? (
          <div className="pointer-events-none absolute inset-3 rounded-[22px] border-2 border-[#ffb347]/80" />
        ) : null}
      </div>
    </div>
  );
}
