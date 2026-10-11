/** Suspense の fallback。Cache Components では、cookie や今日の日付を読む部分をこの境界の中で描く。 */
export function Loading() {
  return <p className="py-16 text-center text-sm text-neutral-500">読み込み中…</p>;
}
