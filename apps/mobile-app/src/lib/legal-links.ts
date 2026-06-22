import Constants from "expo-constants";

function landingSiteUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.landingUrl as string | undefined;
  return (fromExtra ?? process.env.EXPO_PUBLIC_LANDING_URL ?? "https://vibestyle.art").replace(/\/$/, "");
}

export const legalLinks = {
  privacy: `${landingSiteUrl()}/privacy`,
  terms: `${landingSiteUrl()}/terms`,
} as const;
