"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SetInterestResult = { ok: true } | { ok: false; reason: "no_session" | "invalid" | "failed" };

/**
 * 気になるを付ける／外す。ユーザーはセッションから決め、クライアントからは展示の id だけを受け取る。
 * 他人の行を触れないことは RLS でも保証している（0015）。
 */
export async function setInterest(exhibitionId: string, interested: boolean): Promise<SetInterestResult> {
  if (typeof exhibitionId !== "string" || !UUID.test(exhibitionId) || typeof interested !== "boolean") {
    return { ok: false, reason: "invalid" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { ok: false, reason: "no_session" };

  const { error } = interested
    ? await supabase
        .from("interests")
        .upsert({ user_id: userId, exhibition_id: exhibitionId }, { ignoreDuplicates: true })
    : await supabase.from("interests").delete().eq("user_id", userId).eq("exhibition_id", exhibitionId);

  if (error) return { ok: false, reason: "failed" };

  refresh();
  return { ok: true };
}
