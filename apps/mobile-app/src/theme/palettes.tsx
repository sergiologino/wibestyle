import { createContext, useContext, type ReactNode } from "react";
import type { InterfacePalette } from "@wibestyle/shared-types";

export type AppTheme = {
  id: InterfacePalette;
  label: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    primaryBg: string;
    primaryGlow: string;
    secondary: string;
    secondarySoft: string;
    black: string;
    muted: string;
    eyebrow: string;
    white: string;
    border: string;
    borderLight: string;
    surfaceGradient: [string, string, string];
    shadow: string;
  };
};

export const interfacePalettes: Record<InterfacePalette, AppTheme> = {
  vibe: {
    id: "vibe",
    label: "Vibe pink",
    description: "Розовый и фиолетовый — текущий фирменный стиль.",
    colors: {
      primary: "#ff1fa2",
      primaryDark: "#eb1692",
      primarySoft: "#ffd1ed",
      primaryBg: "#fff4fb",
      primaryGlow: "rgba(255, 31, 162, 0.22)",
      secondary: "#782cff",
      secondarySoft: "#faf7ff",
      black: "#14101a",
      muted: "#6d6273",
      eyebrow: "#9a8f99",
      white: "#ffffff",
      border: "rgba(255, 209, 237, 0.85)",
      borderLight: "#ffd1ed",
      surfaceGradient: ["#ffffff", "#fff4fb", "#ffffff"],
      shadow: "#3a0c52",
    },
  },
  pistachio: {
    id: "pistachio",
    label: "Фисташка",
    description: "Тёплый бежевый фон и спокойный зелёный акцент.",
    colors: {
      primary: "#7a9b56",
      primaryDark: "#5f7e3d",
      primarySoft: "#dfeacb",
      primaryBg: "#f8f6ec",
      primaryGlow: "rgba(122, 155, 86, 0.22)",
      secondary: "#b78347",
      secondarySoft: "#fff5e4",
      black: "#181610",
      muted: "#6f6858",
      eyebrow: "#988f7b",
      white: "#ffffff",
      border: "rgba(223, 234, 203, 0.95)",
      borderLight: "#dfeacb",
      surfaceGradient: ["#ffffff", "#f8f6ec", "#ffffff"],
      shadow: "#3d4428",
    },
  },
  graphite: {
    id: "graphite",
    label: "Графит",
    description: "Нейтральная светлая схема с сине-графитовым акцентом.",
    colors: {
      primary: "#42677f",
      primaryDark: "#2f5067",
      primarySoft: "#d7e4ea",
      primaryBg: "#f4f7f8",
      primaryGlow: "rgba(66, 103, 127, 0.2)",
      secondary: "#8a6f58",
      secondarySoft: "#f8f1ea",
      black: "#111820",
      muted: "#63707a",
      eyebrow: "#89949c",
      white: "#ffffff",
      border: "rgba(215, 228, 234, 0.95)",
      borderLight: "#d7e4ea",
      surfaceGradient: ["#ffffff", "#f4f7f8", "#ffffff"],
      shadow: "#26323b",
    },
  },
};

export function resolveInterfacePalette(value?: string | null): InterfacePalette {
  return value === "pistachio" || value === "graphite" ? value : "vibe";
}

const ThemeContext = createContext<AppTheme>(interfacePalettes.vibe);

export function InterfaceThemeProvider({
  palette,
  children,
}: {
  palette?: string | null;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={interfacePalettes[resolveInterfacePalette(palette)]}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
