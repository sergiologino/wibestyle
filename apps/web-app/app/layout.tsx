import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import AppShell from "@/components/AppShell";
import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Я на стиле — виртуальная примерочная",
  description: "Примерь одежду с маркетплейса на себе до покупки.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-inter)] antialiased">
        <AppSessionProvider>
          <AppShell>{children}</AppShell>
        </AppSessionProvider>
      </body>
    </html>
  );
}
