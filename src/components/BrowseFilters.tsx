"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, type TouchEvent, useOptimistic, useRef, useTransition } from "react";
import type { AreaFilter, BrowseTab } from "@/lib/exhibitions";
import { type Point, swipeOf } from "@/ui/swipe";
import { FlyerGridSkeleton } from "./Skeletons";

const TABS: { tab: BrowseTab; label: string }[] = [
  { tab: "ongoing", label: "開催中" },
  { tab: "upcoming", label: "もうすぐ" },
];

type Selection = { tab: BrowseTab; area: AreaFilter };

/**
 * 眺めるページのタブとエリアの選択肢（0014）。
 * 同じページの中の切り替えでは、次のデータが届くまで前の画面が残り、押せたのかがわからない。
 * そこで押した瞬間に選択の表示を切り替え、届くまでグリッドを仮の表示にする。
 * グリッドの上の横スワイプでもタブを切り替える（0032）。
 */
export function BrowseFilters({
  tab,
  area,
  areas,
  children,
}: Selection & { areas: Map<string, string[]>; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useOptimistic<Selection>({ tab, area });

  const touchStart = useRef<Point | null>(null);

  function go(next: Selection) {
    startTransition(() => {
      setSelection(next);
      router.push(hrefOf(next));
    });
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, next: Selection) {
    // 新しいタブで開くなどの操作は、ふつうのリンクとして扱う。
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    go(next);
  }

  function onTouchStart(event: TouchEvent) {
    // 2本指（拡大など）はスワイプにしない。
    touchStart.current = event.touches.length === 1 ? pointOf(event.touches[0]) : null;
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const swipe = swipeOf(start, pointOf(event.changedTouches[0]), window.innerWidth);
    // 左へスワイプで右隣のタブへ、右へスワイプで左隣のタブへ。端のタブではそれ以上進まない。
    const index = TABS.findIndex(({ tab: t }) => t === selection.tab) + (swipe === "left" ? 1 : swipe === "right" ? -1 : 0);
    const next = TABS[index];
    if (swipe && next) go({ tab: next.tab, area: selection.area });
  }

  const link = (next: Selection, active: boolean, className: string, label: string) => (
    <Link
      key={label}
      href={hrefOf(next)}
      onClick={(event) => navigate(event, next)}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {label}
    </Link>
  );

  const current = selection;
  const municipalities = current.area.prefecture ? (areas.get(current.area.prefecture) ?? []) : [];
  const chipClass = (active: boolean) =>
    [
      "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300",
    ].join(" ");
  const chip = (label: string, area: AreaFilter, active: boolean) =>
    link({ tab: current.tab, area }, active, chipClass(active), label);

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map(({ tab: t, label }) =>
          link(
            { tab: t, area: current.area },
            t === current.tab,
            [
              "flex-1 border-b-2 py-2 text-center text-sm",
              t === current.tab ? "border-foreground font-bold" : "border-transparent text-neutral-500",
            ].join(" "),
            label,
          ),
        )}
      </nav>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto">
          {chip("すべて", {}, !current.area.prefecture)}
          {[...areas.keys()].map((prefecture) =>
            chip(prefecture, { prefecture }, current.area.prefecture === prefecture),
          )}
        </div>
        {current.area.prefecture && municipalities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {chip(`${current.area.prefecture}すべて`, { prefecture: current.area.prefecture }, !current.area.municipality)}
            {municipalities.map((municipality) =>
              chip(
                municipality,
                { prefecture: current.area.prefecture, municipality },
                current.area.municipality === municipality,
              ),
            )}
          </div>
        )}
      </div>

      {/* チップの行は横にスクロールするので、スワイプはグリッドの上だけで受け取る。 */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => (touchStart.current = null)}>
        {pending ? <FlyerGridSkeleton /> : children}
      </div>
    </div>
  );
}

function pointOf(touch: { clientX: number; clientY: number }): Point {
  return { x: touch.clientX, y: touch.clientY };
}

function hrefOf({ tab, area }: Selection): string {
  const query = new URLSearchParams();
  if (area.prefecture) query.set("pref", area.prefecture);
  if (area.municipality) query.set("city", area.municipality);
  query.set("tab", tab);
  return `/?${query}`;
}
