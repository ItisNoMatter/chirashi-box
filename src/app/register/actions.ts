"use server";

import { ClaudeExhibitionExtractor } from "@/pipeline/adapters/claude-extractor";
import { GooglePlaceSearch } from "@/pipeline/adapters/google-places";
import { HttpPageFetcher } from "@/pipeline/adapters/http-fetcher";
import { SupabaseRegistrationStore } from "@/pipeline/adapters/supabase-store";
import type { RegistrationUser, VenueCandidate } from "@/pipeline/ports";
import {
  type ConfirmResult,
  confirmUrlRegistration,
  type RegistrationDeps,
  type StartResult,
  startUrlRegistration,
} from "@/pipeline/url-registration";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** 1アカウントが24時間に始められる URL 登録の数（0008: お金のかかる操作をアカウント単位で制限する）。会場の検索も数える。 */
const DAILY_LIMIT = 20;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActionError = { kind: "error"; reason: "email_required" | "rate_limited" | "invalid" | "failed" };

export async function startRegistration(url: string): Promise<StartResult | ActionError> {
  if (typeof url !== "string" || url.length > 2000 || !/^https?:\/\//i.test(url.trim())) {
    return { kind: "error", reason: "invalid" };
  }
  const user = await currentRegistrationUser();
  if (!user?.hasEmail) return { kind: "error", reason: "email_required" };
  if (await overDailyLimit(user.id)) return { kind: "error", reason: "rate_limited" };

  try {
    return await startUrlRegistration(url.trim(), user, deps());
  } catch (error) {
    console.error("URL登録の開始に失敗しました", error);
    return { kind: "error", reason: "failed" };
  }
}

export async function confirmRegistration(
  pendingId: string,
  placeId: string,
  sameAsExhibitionId?: string | null,
): Promise<ConfirmResult | ActionError> {
  if (
    !UUID.test(pendingId) ||
    typeof placeId !== "string" ||
    !(sameAsExhibitionId === undefined || sameAsExhibitionId === null || UUID.test(sameAsExhibitionId))
  ) {
    return { kind: "error", reason: "invalid" };
  }
  const user = await currentRegistrationUser();
  if (!user?.hasEmail) return { kind: "error", reason: "email_required" };

  try {
    return await confirmUrlRegistration(pendingId, { placeId, sameAsExhibitionId }, user, deps());
  } catch (error) {
    console.error("URL登録の確定に失敗しました", error);
    return { kind: "error", reason: "failed" };
  }
}

/** 会場を選び直すときの検索（0005）。Places の結果は表示にだけ使い、保存しない（0020）。 */
export async function searchVenues(query: string): Promise<VenueCandidate[] | ActionError> {
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 200) {
    return { kind: "error", reason: "invalid" };
  }
  const user = await currentRegistrationUser();
  if (!user?.hasEmail) return { kind: "error", reason: "email_required" };
  if (await overDailyLimit(user.id)) return { kind: "error", reason: "rate_limited" };
  try {
    return await new GooglePlaceSearch().searchVenue({ name: query.trim(), address: null });
  } catch (error) {
    console.error("会場の検索に失敗しました", error);
    return { kind: "error", reason: "failed" };
  }
}

function deps(): RegistrationDeps {
  return {
    fetcher: new HttpPageFetcher(),
    extractor: new ClaudeExhibitionExtractor(() =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date()),
    ),
    places: new GooglePlaceSearch(),
    store: new SupabaseRegistrationStore(),
  };
}

async function currentRegistrationUser(): Promise<RegistrationUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, hasEmail: Boolean(claims.email) && claims.is_anonymous !== true };
}

async function overDailyLimit(userId: string): Promise<boolean> {
  const db = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("registration_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;
  if ((count ?? 0) >= DAILY_LIMIT) return true;
  // 断られた試行も費用がかかるので、始めた時点で記録する。
  const { error: insertError } = await db.from("registration_attempts").insert({ user_id: userId });
  if (insertError) throw insertError;
  return false;
}
