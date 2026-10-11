import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import Link from "next/link";
import { FlyerGrid } from "@/components/FlyerGrid";
import { type AreaFilter, type BrowseTab, browseExhibitions, listAreas, listMyInterestIds } from "@/lib/exhibitions";
import { todayInTokyo } from "@/lib/today";

const TABS: { tab: BrowseTab; label: string }[] = [
  { tab: "ongoing", label: "開催中" },
  { tab: "upcoming", label: "もうすぐ" },
];

export default function BrowsePage(props: PageProps<"/">) {
  return (
    <Suspense fallback={<Loading />}>
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
    <div className="flex flex-col gap-4">
      <nav className="flex border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map(({ tab: t, label }) => (
          <Link
            key={t}
            href={{ query: { ...withoutEmpty({ pref: area.prefecture, city: area.municipality }), tab: t } }}
            className={[
              "flex-1 border-b-2 py-2 text-center text-sm",
              t === tab ? "border-foreground font-bold" : "border-transparent text-neutral-500",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </nav>

      <AreaPicker areas={areas} area={area} tab={tab} />

      {flyers.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">この条件の展示はまだありません</p>
      ) : (
        <FlyerGrid flyers={flyers} interestedIds={interestedIds} today={today} />
      )}
    </div>
  );
}

function AreaPicker({ areas, area, tab }: { areas: Map<string, string[]>; area: AreaFilter; tab: BrowseTab }) {
  const municipalities = area.prefecture ? (areas.get(area.prefecture) ?? []) : [];
  const chip = (label: string, query: Record<string, string>, active: boolean) => (
    <Link
      key={label}
      href={{ query: { ...query, tab } }}
      className={[
        "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto">
        {chip("すべて", {}, !area.prefecture)}
        {[...areas.keys()].map((prefecture) => chip(prefecture, { pref: prefecture }, area.prefecture === prefecture))}
      </div>
      {municipalities.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {chip(`${area.prefecture}すべて`, { pref: area.prefecture! }, !area.municipality)}
          {municipalities.map((municipality) =>
            chip(municipality, { pref: area.prefecture!, city: municipality }, area.municipality === municipality),
          )}
        </div>
      )}
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value || undefined;
}

function withoutEmpty(query: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(query).filter((entry): entry is [string, string] => !!entry[1]));
}
