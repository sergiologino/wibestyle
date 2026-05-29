import clsx from "clsx";
import { BrandMark } from "./BrandMark";

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  markClassName?: string;
};

export function BrandLogo({ className, showText = true, markClassName }: BrandLogoProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={clsx("h-8 w-8", markClassName)} />
      {showText ? (
        <span className="font-[family-name:var(--font-manrope)] text-[1.15rem] font-normal tracking-[-0.02em] text-[#14101a]">
          Я на <span className="text-[#ff1fa2]">стиле</span>
        </span>
      ) : null}
    </span>
  );
}
