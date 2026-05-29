export const wibeTokens = {
  colors: {
    pink: "#ff1fa2",
    pink2: "#ff4dbc",
    violet: "#782cff",
    purple: "#b100ff",
    orange: "#ff7a1a",
    black: "#14101a",
    muted: "#6d6273",
    paper: "#fff8fd",
    white: "#fff",
  },
  radius: {
    xl: "38px",
    lg: "28px",
    md: "18px",
    pill: "999px",
  },
  shadow: {
    pink: "0 28px 70px rgba(255, 31, 162, 0.28)",
    soft: "0 20px 60px rgba(58, 12, 82, 0.14)",
    card: "0 12px 34px rgba(255, 31, 162, 0.18), 0 4px 12px rgba(120, 44, 255, 0.12)",
  },
  gradient: {
    brand: "linear-gradient(135deg, #ff1fa2, #b100ff)",
    hero: "linear-gradient(115deg, #fff 0%, #fff4fb 33%, #ffe4f5 66%, #fff 100%)",
    cta: "linear-gradient(135deg, #ff6b00, #ff1fa2 50%, #7b2cff)",
  },
} as const;

export { BrandLogo } from "./components/BrandLogo";
export { BrandMark } from "./components/BrandMark";
export { Button } from "./components/Button";
export { Card } from "./components/Card";
export { Pill } from "./components/Pill";
export { StepIndicator } from "./components/StepIndicator";
export { BeforeAfterSlider } from "./components/BeforeAfterSlider";
export { ResultReveal } from "./components/ResultReveal";
export { ShareCard } from "./components/ShareCard";
