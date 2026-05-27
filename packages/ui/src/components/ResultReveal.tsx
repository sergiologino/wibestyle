"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type ResultRevealProps = {
  imageSrc: string;
  alt: string;
  eliteFrame?: boolean;
};

export function ResultReveal({ imageSrc, alt, eliteFrame = false }: ResultRevealProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-[32px] border bg-white p-2 shadow-[0_28px_70px_rgba(255,31,162,0.18),0_10px_30px_rgba(120,44,255,0.12)] transition-[transform,opacity] duration-700",
        eliteFrame ? "border-[#ffb347]" : "border-[#ffd1ed]",
        revealed ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
      )}
    >
      {eliteFrame ? (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[28px] border-4 border-[linear-gradient(135deg,#ffb347,#ff1fa2)]" />
      ) : null}
      <img src={imageSrc} alt={alt} className="h-full w-full rounded-[26px] object-cover" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[26px] bg-[linear-gradient(180deg,transparent,rgba(20,16,26,0.55))] px-5 py-6">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-white/85">Я на стиле</p>
        <p className="text-lg font-black text-white">Твой новый look ✦</p>
      </div>
    </div>
  );
}
