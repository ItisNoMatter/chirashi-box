"use client";

import { useState } from "react";
import type { FlyerData } from "@/lib/exhibitions";

/**
 * チラシ（CONTEXT.md）。館の画像があればそれを、なければ展示名・会場・会期から作った絵柄を出す（0007）。
 * 画像は館のサーバーから直接読み込み、トリミングせず全体を表示する。
 * next/image は画像を自前のサーバーで最適化（＝複製）するので使わない。
 */
export function Flyer({ flyer }: { flyer: FlyerData }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = flyer.imageUrl !== null && !imageFailed;

  return (
    <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-sm bg-neutral-100 shadow-sm dark:bg-neutral-800">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- 0007: 画像を複製しないため直接読み込む
        <img
          src={flyer.imageUrl!}
          alt={flyer.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <GeneratedFlyer flyer={flyer} />
      )}
    </div>
  );
}

function GeneratedFlyer({ flyer }: { flyer: FlyerData }) {
  const hue = hashOf(flyer.title) % 360;
  return (
    <div
      className="flex h-full w-full flex-col justify-between p-2 text-white"
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 45% 42%), hsl(${(hue + 40) % 360} 50% 22%))`,
      }}
    >
      <p className="line-clamp-5 text-[13px] font-bold leading-snug">{flyer.title}</p>
      <div className="text-[10px] leading-tight opacity-90">
        <p className="line-clamp-2">{flyer.venueName}</p>
        <p>
          {formatDate(flyer.startDate)}–{formatDate(flyer.endDate)}
        </p>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function hashOf(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return hash;
}
