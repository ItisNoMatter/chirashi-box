/**
 * データを待つあいだの仮の表示。読み込み後と同じ形・大きさにして、届いたときに画面が動かないようにする。
 * Cache Components では、cookie や今日の日付を読む部分を Suspense の中で描くので、その fallback に使う。
 */

const bone = "animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-800";

/** チラシの3列グリッド（FlyerGrid）の仮の表示。 */
export function FlyerGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-3 gap-x-2 gap-y-4" aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-1">
          <div className={`aspect-[1/1.414] w-full ${bone}`} />
          <div className={`h-3 w-full ${bone}`} />
          <div className={`h-3 w-2/3 ${bone}`} />
          <div className={`mt-1 h-6 w-16 rounded-full ${bone}`} />
        </li>
      ))}
    </ul>
  );
}

/** 眺めるページの仮の表示。タブ・エリアの選択肢・グリッド。 */
export function BrowseSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        {["開催中", "もうすぐ"].map((label) => (
          <span key={label} className="flex-1 border-b-2 border-transparent py-2 text-center text-sm text-neutral-400">
            {label}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        {[12, 16, 16].map((w, i) => (
          <div key={i} className={`h-6 rounded-full ${bone}`} style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <FlyerGridSkeleton />
    </div>
  );
}

/** 展示の詳細ページの仮の表示。 */
export function ExhibitionSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="読み込み中">
      <div className={`mx-auto aspect-[1/1.414] w-2/3 ${bone}`} />
      <div className="flex flex-col gap-2">
        <div className={`h-6 w-4/5 ${bone}`} />
        <div className={`h-4 w-1/2 ${bone}`} />
        <div className={`h-3 w-2/3 ${bone}`} />
        <div className={`h-4 w-3/5 ${bone}`} />
      </div>
      <div className={`h-9 w-32 rounded-full ${bone}`} />
    </div>
  );
}

/** マイページの仮の表示。件数の行とグリッド。 */
export function MyPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-around border-b border-neutral-200 pb-4 dark:border-neutral-800">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`h-6 w-6 ${bone}`} />
            <div className={`h-3 w-10 ${bone}`} />
          </div>
        ))}
      </div>
      <FlyerGridSkeleton count={6} />
    </div>
  );
}
