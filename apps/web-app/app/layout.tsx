import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import AppShell from "@/components/AppShell";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import YandexMetrika from "@/components/YandexMetrika";
import { appBaseUrl, brandDomain } from "@/lib/api-media";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: "Я на стиле — виртуальная примерочная",
  description: "Примерь одежду с маркетплейса на себе до покупки.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: brandDomain(),
    title: "Я на стиле — виртуальная примерочная",
    description: "Примерь одежду с маркетплейса на себе до покупки.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-inter)] antialiased">
        <YandexMetrika />
        <AppSessionProvider>
          <AppShell>{children}</AppShell>
        </AppSessionProvider>
      </body>
    </html>
  );
}
