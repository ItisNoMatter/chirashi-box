"use client";

import { useOptimistic, useTransition } from "react";
import { setInterest } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

/**
 * 気になるボタン。まだユーザーがいなければ、初めて押したときに匿名ユーザーを作る（0019）。
 */
export function InterestButton({
  exhibitionId,
  interested,
  size = "small",
}: {
  exhibitionId: string;
  interested: boolean;
  size?: "small" | "large";
}) {
  const [optimisticInterested, setOptimisticInterested] = useOptimistic(interested);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optimisticInterested;
    startTransition(async () => {
      setOptimisticInterested(next);
      let result = await setInterest(exhibitionId, next);
      if (!result.ok && result.reason === "no_session") {
        const signedIn = await signInAnonymously();
        if (signedIn) result = await setInterest(exhibitionId, next);
      }
      if (!result.ok) {
        // 楽観的な表示はトランジションの終了とともに元の値へ戻る。
        console.error("気になるの更新に失敗しました", result.reason);
      }
    });
  }

  const label = optimisticInterested ? "気になる済み" : "気になる";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimisticInterested}
      className={[
        "inline-flex items-center justify-center gap-1 rounded-full border font-medium transition-colors",
        size === "large" ? "px-5 py-2 text-sm" : "px-2 py-0.5 text-[11px]",
        optimisticInterested
          ? "border-amber-500 bg-amber-500 text-white"
          : "border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-300",
      ].join(" ")}
    >
      <span aria-hidden>{optimisticInterested ? "★" : "☆"}</span>
      {label}
    </button>
  );
}

async function signInAnonymously(): Promise<boolean> {
  const supabase = createClient();
  // TODO: 本番では Turnstile のトークンを options.captchaToken に渡す（0008, 0019）。
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("匿名サインインに失敗しました", error.message);
    return false;
  }
  return true;
}
