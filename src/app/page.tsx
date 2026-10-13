import { Suspense } from "react";
import { BrowseFilters } from "@/components/BrowseFilters";
import { FlyerGrid } from "@/components/FlyerGrid";
import { BrowseSkeleton } from "@/components/Skeletons";
import { type AreaFilter, type BrowseTab, browseExhibitions, listAreas, listMyInterestIds } from "@/lib/exhibitions";
import { todayInTokyo } from "@/lib/today";

export default function BrowsePage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowsePageContent {...props} />
    </Suspense>
  );
}

/** 眺める（0014）。 */
async function BrowsePageContent(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const tab: BrowseTab = searchParams.tab === "upcoming" ? "upcoming" : "ongoing";
  const area: AreaFilter = {
    prefecture: single(searchParams.pref),
    municipality: single(searchParams.city),
  };
  const today = await todayInTokyo();

  const [flyers, areas, interestedIds] = await Promise.all([
    browseExhibitions(tab, area, today),
    listAreas(),
    listMyInterestIds(),
  ]);

  return (
    <BrowseFilters tab={tab} area={area} areas={areas}>
      {flyers.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">この条件の展示はまだありません</p>
      ) : (
        <FlyerGrid flyers={flyers} interestedIds={interestedIds} today={today} />
      )}
    </BrowseFilters>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value || undefined;
}
