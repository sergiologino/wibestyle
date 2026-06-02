import clsx from "clsx";
import { BrandMarkGraphicSvg } from "./BrandMarkGraphicSvg";

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  markClassName?: string;
};

export function BrandLogo({ className, showText = true, markClassName }: BrandLogoProps) {
  return (
    <span className={clsx("inline-flex items-center", className)} style={{ gap: "14px" }}>
      <BrandMarkGraphicSvg
        className={clsx(
          "h-12 w-12 rounded-full shadow-[0_10px_24px_rgba(255,31,162,0.22)]",
          markClassName,
        )}
        title="VibeStyle"
      />
      {showText ? (
        <span className="font-[family-name:var(--font-manrope)] text-[1.08rem] font-normal tracking-[-0.02em] text-[#14101a]">
          vibe<span className="text-[#ff1fa2]">style</span>
          <span className="text-[#9a8f99]">.art</span>
        </span>
      ) : null}
    </span>
  );
}
