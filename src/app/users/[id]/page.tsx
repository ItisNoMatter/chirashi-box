import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlyerGrid } from "@/components/FlyerGrid";
import { arrangeMyPage } from "@/domain/my-page";
import { currentUserId, type FlyerData, listMyInterests } from "@/lib/exhibitions";
import { todayInTokyo } from "@/lib/today";

export default function UserPage(props: PageProps<"/users/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <UserPageContent {...props} />
    </Suspense>
  );
}

/** マイページ（0015）。MVP では本人だけが見られる。 */
async function UserPageContent(props: PageProps<"/users/[id]">) {
  const { id } = await props.params;
  const userId = await currentUserId();
  if (userId === null || userId !== id) notFound();

  const today = await todayInTokyo();
  const flyers = await listMyInterests();
  const page = arrangeMyPage(flyers, today);
  const interestedIds = new Set(flyers.map((flyer) => flyer.id));

  if (flyers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm">まだ「気になる」はありません</p>
        <Link href="/" className="rounded-full border px-4 py-1.5 text-sm">
          展示を眺める
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <dl className="flex justify-around border-b border-neutral-200 pb-4 text-center dark:border-neutral-800">
        <Count label="開催中" count={page.ongoing.length} />
        <Count label="もうすぐ" count={page.upcoming.length} />
        <Count label="終了" count={page.ended.length} />
      </dl>
      <Section title="開催中" flyers={page.ongoing} interestedIds={interestedIds} today={today} />
      <Section title="もうすぐ" flyers={page.upcoming} interestedIds={interestedIds} today={today} />
      <Section title="終了" flyers={page.ended} interestedIds={interestedIds} today={today} />
    </div>
  );
}

function Count({ label, count }: { label: string; count: number }) {
  return (
    <div>
      <dd className="text-xl font-bold">{count}</dd>
      <dt className="text-xs text-neutral-500">{label}</dt>
    </div>
  );
}

function Section({
  title,
  flyers,
  interestedIds,
  today,
}: {
  title: string;
  flyers: FlyerData[];
  interestedIds: Set<string>;
  today: string;
}) {
  if (flyers.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold">
        {title} <span className="font-normal text-neutral-500">{flyers.length}</span>
      </h2>
      <FlyerGrid flyers={flyers} interestedIds={interestedIds} today={today} />
    </section>
  );
}
