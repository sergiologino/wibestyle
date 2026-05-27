import type { Metadata } from "next";
import GalleryClient from "@/components/gallery/GalleryClient";
import { appBaseUrl } from "@/lib/api-media";

export const metadata: Metadata = {
  title: "Галерея образов — виртуальная примерка | Я на стиле",
  description:
    "Публичные образы сообщества WibeStyle: виртуальная примерка одежды с маркетплейсов, имена авторов и ссылки на детальные страницы look.",
  alternates: { canonical: `${appBaseUrl()}/gallery` },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${appBaseUrl()}/gallery`,
    siteName: "Я на стиле",
    title: "Галерея образов WibeStyle",
    description: "Смотри образы сообщества и примеряй похожие look на себе.",
  },
  robots: { index: true, follow: true },
};

export default function GalleryPage() {
  return <GalleryClient />;
}