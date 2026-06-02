import clsx from "clsx";
import { BrandMarkGraphicSvg } from "./BrandMarkGraphicSvg";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className, title = "VibeStyle" }: BrandMarkProps) {
  return (
    <BrandMarkGraphicSvg
      className={clsx("rounded-full", className)}
      title={title}
    />
  );
}
