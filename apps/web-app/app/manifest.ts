import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Я на стиле — виртуальная примерочная",
    short_name: "Я на стиле",
    description: "Примеряйте одежду с маркетплейсов на себе до покупки.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fff8fd",
    theme_color: "#ff1fa2",
    icons: [
      {
        src: "/assets/brand/app-logo-round.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand/app-logo-round.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
