import Link from "next/link";
import { daysUntilEnd, type LocalDate, periodStatusOf } from "@/domain/period";
import type { FlyerData } from "@/lib/exhibitions";
import { Flyer } from "./Flyer";
import { InterestButton } from "./InterestButton";

/** チラシの3列グリッド。開催中で終わりが近い展示には、タイトルの前に「あと◯日」の札を付ける（0014）。 */
export function FlyerGrid({
  flyers,
  interestedIds,
  today,
}: {
  flyers: FlyerData[];
  interestedIds: Set<string>;
  today: LocalDate;
}) {
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
      {flyers.map((flyer) => (
        <li key={flyer.id} className="flex flex-col gap-1">
          <Link href={`/exhibitions/${flyer.id}`} className="block">
            <Flyer flyer={flyer} />
          </Link>
          <Link href={`/exhibitions/${flyer.id}`} className="line-clamp-2 text-[11px] leading-tight">
            <DaysLeftBadge flyer={flyer} today={today} />
            {flyer.title}
          </Link>
          <div>
            <InterestButton exhibitionId={flyer.id} interested={interestedIds.has(flyer.id)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DAYS_LEFT_THRESHOLD = 14;

function DaysLeftBadge({ flyer, today }: { flyer: FlyerData; today: LocalDate }) {
  if (periodStatusOf(flyer, today) !== "開催中") return null;
  const days = daysUntilEnd(flyer, today);
  if (days > DAYS_LEFT_THRESHOLD) return null;
  return (
    // チラシに重ねると、自動生成カードのタイトルや館の画像（作品）を隠すので、タイトル行の先頭に置く。
    <span className="mr-1 inline-block rounded-sm bg-red-600 px-1 align-[1px] text-[10px] font-bold leading-[14px] text-white">
      {days === 0 ? "今日まで" : `あと${days}日`}
    </span>
  );
}
