export type AnthropometryInput = {
  heightCm?: number;
  bustCm?: number;
  waistCm?: number;
  hipsCm?: number;
};

export function validateRequiredAnthropometry(input: AnthropometryInput): string | null {
  if (!input.heightCm || input.heightCm < 120 || input.heightCm > 230) {
    return "Укажите рост от 120 до 230 см";
  }
  if (!input.bustCm || input.bustCm < 60 || input.bustCm > 160) {
    return "Укажите обхват груди";
  }
  if (!input.waistCm || input.waistCm < 50 || input.waistCm > 150) {
    return "Укажите обхват талии";
  }
  if (!input.hipsCm || input.hipsCm < 60 || input.hipsCm > 170) {
    return "Укажите обхват бёдер";
  }
  return null;
}

export function parsePositiveInt(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
