import type { Metadata } from "next";
import "./globals.css";
import { AdminKeyProvider } from "@/components/admin-key-provider";

export const metadata: Metadata = {
  title: "WibeStyle Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AdminKeyProvider>{children}</AdminKeyProvider>
      </body>
    </html>
  );
}
