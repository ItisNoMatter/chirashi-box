import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/exhibitions";

export default function MePage() {
  return (
    <Suspense fallback={<Loading />}>
      <MePageContent />
    </Suspense>
  );
}

/** 自分のマイページへの入口。まだユーザーがいなければ空の状態を出す（0019）。 */
async function MePageContent() {
  const userId = await currentUserId();
  if (userId) redirect(`/users/${userId}`);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm">まだ「気になる」はありません</p>
      <p className="text-xs text-neutral-500">展示の「☆ 気になる」を押すと、ここにチラシが並びます</p>
      <Link href="/" className="mt-2 rounded-full border px-4 py-1.5 text-sm">
        展示を眺める
      </Link>
    </div>
  );
}
