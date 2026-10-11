import type { MetadataRoute } from "next";

/** PWA の manifest（0013）。アイコンは仮。 */
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
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
