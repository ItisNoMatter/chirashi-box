import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { notFound } from "next/navigation";
import { Flyer } from "@/components/Flyer";
import { InterestButton } from "@/components/InterestButton";
import { daysUntilEnd, periodStatusOf } from "@/domain/period";
import { getExhibition, listMyInterestIds } from "@/lib/exhibitions";
import { todayInTokyo } from "@/lib/today";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ExhibitionPage(props: PageProps<"/exhibitions/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <ExhibitionPageContent {...props} />
    </Suspense>
  );
}

/** 展示の詳細。解説は載せず、公式ページへ誘導する（0016）。 */
async function ExhibitionPageContent(props: PageProps<"/exhibitions/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const [exhibition, interestedIds] = await Promise.all([getExhibition(id), listMyInterestIds()]);
  if (!exhibition) notFound();

  const today = await todayInTokyo();
  const status = periodStatusOf(exhibition, today);

  return (
    <article className="flex flex-col gap-5">
      <div className="mx-auto w-2/3">
        <Flyer flyer={exhibition} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold leading-snug">{exhibition.title}</h1>
        <p className="text-sm">{exhibition.venueName}</p>
        {exhibition.venueAddress && <p className="text-xs text-neutral-500">{exhibition.venueAddress}</p>}
        <p className="text-sm">
          {exhibition.startDate.replaceAll("-", "/")} 〜 {exhibition.endDate.replaceAll("-", "/")}
          <span className="ml-2 rounded-sm bg-neutral-200 px-1.5 py-0.5 text-xs dark:bg-neutral-700">
            {status === "開催中" ? `開催中・あと${daysUntilEnd(exhibition, today)}日` : status}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InterestButton exhibitionId={exhibition.id} interested={interestedIds.has(exhibition.id)} size="large" />
        {exhibition.officialUrl && (
          <a
            href={exhibition.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline underline-offset-4"
          >
            公式ページを見る ↗
          </a>
        )}
      </div>
    </article>
  );
}
