/** WibeStyle mobile design tokens — aligned with web-app globals.css */
export const colors = {
  pink: "#ff1fa2",
  pinkDark: "#eb1692",
  pinkSoft: "#ffd1ed",
  pinkBg: "#fff4fb",
  pinkGlow: "rgba(255, 31, 162, 0.22)",
  violet: "#782cff",
  violetSoft: "#faf7ff",
  black: "#14101a",
  muted: "#6d6273",
  eyebrow: "#9a8f99",
  white: "#ffffff",
  border: "rgba(255, 209, 237, 0.85)",
  borderLight: "#ffd1ed",
  danger: "#e5484d",
  success: "#30a46c",
  overlay: "rgba(20, 16, 26, 0.45)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const hairline = 0.5;

export const shadows = {
  card: {
    shadowColor: "#3a0c52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  button: {
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const typography = {
  eyebrow: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    color: colors.eyebrow,
  },
  display: {
    fontSize: 32,
    fontWeight: "300" as const,
    letterSpacing: -0.5,
    color: colors.black,
    lineHeight: 38,
  },
  displayMd: {
    fontSize: 24,
    fontWeight: "400" as const,
    letterSpacing: -0.3,
    color: colors.black,
    lineHeight: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "500" as const,
    letterSpacing: -0.2,
    color: colors.black,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 24,
    color: colors.muted,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 20,
    color: colors.muted,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.black,
  },
  link: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: colors.pink,
  },
};
