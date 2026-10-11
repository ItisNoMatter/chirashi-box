import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/AppIconArt";

/** Android などのホーム画面と、manifest が参照するアイコン（0013）。URL は /icon/192 と /icon/512。 */
export function generateImageMetadata() {
  return [192, 512].map((px) => ({ id: String(px), size: { width: px, height: px }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const px = Number(await id);
  return new ImageResponse(<AppIconArt size={px} />, { width: px, height: px });
}
