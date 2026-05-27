import type { Anthropometry } from "@wibestyle/shared-types";

type Gender = "female" | "male" | "other" | undefined;

/** Rough defaults adjusted by photo aspect ratio (full-body portrait heuristic). */
export function estimateAnthropometryFromImage(
  imageWidth: number,
  imageHeight: number,
  gender: Gender,
): Anthropometry {
  const aspect = imageHeight / Math.max(imageWidth, 1);
  const baseHeight = gender === "male" ? 178 : gender === "female" ? 166 : 172;
  const aspectAdjust = Math.round((aspect - 1.55) * 18);
  const heightCm = clamp(Math.round(baseHeight + aspectAdjust), 150, 195);
  const scale = heightCm / 170;

  const bustBase = gender === "male" ? 98 : 88;
  const waistBase = gender === "male" ? 82 : 70;
  const hipsBase = gender === "male" ? 98 : 96;
  const shoeBase = gender === "male" ? 42 : gender === "female" ? 38 : 40;

  return {
    heightCm,
    bustCm: Math.round(bustBase * scale),
    waistCm: Math.round(waistBase * scale),
    hipsCm: Math.round(hipsBase * scale),
    clothingSize: heightCm >= 178 ? "L" : heightCm <= 162 ? "S" : "M",
    shoeSizeEu: Math.round(shoeBase + (heightCm - 170) / 6),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
