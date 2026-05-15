import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import YandexMetrika from "@/components/YandexMetrika";
import JsonLd from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";
import { organizationSchema, softwareApplicationSchema } from "@/lib/schema";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.domain),
  title: {
    default: "Я на стиле — нейропримерочная и виртуальный стилист",
    template: "%s | Я на стиле",
  },
  description: siteConfig.description,
  keywords: [
    "нейропримерка",
    "нейростилист",
    "виртуальная примерочная",
    "примерить одежду онлайн",
    "Wildberries примерка",
    "Ozon примерка",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: siteConfig.name,
    images: [{ url: "/assets/hero-collage.png", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), var(--font-manrope), system-ui, sans-serif" }}>
        <JsonLd data={[organizationSchema(), softwareApplicationSchema()]} />
        <YandexMetrika />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
