import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/AppIconArt";

/** iPhone のホーム画面のアイコン（0013）。角の丸めは iOS が付ける。 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={180} />, size);
}
