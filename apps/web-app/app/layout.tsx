import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import AppShell from "@/components/AppShell";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import YandexMetrika from "@/components/YandexMetrika";
import MarketingVisitorCapture from "@/components/MarketingVisitorCapture";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaServiceWorker from "@/components/PwaServiceWorker";
import { appBaseUrl, brandDomain } from "@/lib/api-media";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: "Я на стиле — виртуальная примерочная",
  description: "Примерь одежду с маркетплейса на себе до покупки.",
  applicationName: "Я на стиле",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Я на стиле",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: "/assets/brand/app-logo-round.png",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: brandDomain(),
    title: "Я на стиле — виртуальная примерочная",
    description: "Примерь одежду с маркетплейса на себе до покупки.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff1fa2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-inter)] antialiased">
        <YandexMetrika />
        <MarketingVisitorCapture />
        <PwaServiceWorker />
        <PwaInstallPrompt />
        <AppSessionProvider>
          <AppShell>{children}</AppShell>
        </AppSessionProvider>
      </body>
    </html>
  );
}
