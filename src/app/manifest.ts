import type { MetadataRoute } from "next";

/** PWA の manifest（0013）。アイコンは src/app/icon.tsx が作る（絵柄は仮）。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "chirashi-box",
    short_name: "chirashi-box",
    description: "気になる展示のチラシを集めるアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ja",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
