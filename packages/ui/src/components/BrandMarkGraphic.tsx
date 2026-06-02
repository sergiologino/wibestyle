"use client";

import clsx from "clsx";
import { BrandMarkGraphicSvg } from "./BrandMarkGraphicSvg";

type BrandMarkGraphicProps = {
  className?: string;
  title?: string;
};

/** Circular vector mark — crisp at any size in the web header. */
export function BrandMarkGraphic({ className, title = "VibeStyle" }: BrandMarkGraphicProps) {
  return <BrandMarkGraphicSvg className={className} title={title} />;
}
