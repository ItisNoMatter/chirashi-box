import "server-only";
import { cache } from "react";
import type { LocalDate, Period } from "@/domain/period";
import { applySitePolicies, type SitePolicy } from "@/domain/site-policy";
import { createClient } from "@/lib/supabase/server";

/** チラシ1枚を描くのに要る情報。 */
export type FlyerData = Period & {
  id: string;
  title: string;
  venueName: string;
  imageUrl: string | null;
};

export type BrowseTab = "ongoing" | "upcoming";

export type AreaFilter = {
  prefecture?: string;
  municipality?: string;
};

const FLYER_COLUMNS = "id, title, start_date, end_date, image_url, official_url, venues!inner(name, prefecture, municipality)";

type FlyerRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  image_url: string | null;
  official_url: string | null;
  venues: { name: string };
};

/** サイトごとのリンク・画像の制限（0025）。1回のリクエストの中では1度だけ読む。 */
const loadSitePolicies = cache(async (): Promise<SitePolicy[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_policies").select("domain, allow_links, allow_images");
  if (error) throw error;
  return data.map((row) => ({ domain: row.domain, allowLinks: row.allow_links, allowImages: row.allow_images }));
});

function toFlyer(row: FlyerRow, policies: SitePolicy[]): FlyerData {
  const { imageUrl } = applySitePolicies({ officialUrl: row.official_url, imageUrl: row.image_url }, policies);
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    imageUrl,
    venueName: row.venues.name,
  };
}

/** 「眺める」の一覧（0014）。開催中は終わるのが近い順、もうすぐは始まるのが近い順。 */
export async function browseExhibitions(
  tab: BrowseTab,
  area: AreaFilter,
  today: LocalDate,
): Promise<FlyerData[]> {
  const supabase = await createClient();
  let query = supabase.from("exhibitions").select(FLYER_COLUMNS);

  query =
    tab === "ongoing"
      ? query.lte("start_date", today).gte("end_date", today).order("end_date")
      : query.gt("start_date", today).order("start_date");

  if (area.prefecture) query = query.eq("venues.prefecture", area.prefecture);
  if (area.municipality) query = query.eq("venues.municipality", area.municipality);

  // TODO: 展示が増えたらページングにする（0004）。
  const [{ data, error }, policies] = await Promise.all([query.order("id").limit(120), loadSitePolicies()]);
  if (error) throw error;
  return (data as FlyerRow[]).map((row) => toFlyer(row, policies));
}

/** エリアの選択肢。都道府県ごとに市区町村をまとめる（0014）。 */
export async function listAreas(): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("prefecture, municipality")
    .not("prefecture", "is", null)
    .order("prefecture")
    .order("municipality");
  if (error) throw error;

  const areas = new Map<string, string[]>();
  for (const { prefecture, municipality } of data) {
    if (!prefecture) continue;
    const municipalities = areas.get(prefecture) ?? [];
    if (municipality && !municipalities.includes(municipality)) municipalities.push(municipality);
    areas.set(prefecture, municipalities);
  }
  return areas;
}

export type ExhibitionDetail = FlyerData & {
  officialUrl: string | null;
  venueAddress: string | null;
};

export async function getExhibition(id: string): Promise<ExhibitionDetail | null> {
  const supabase = await createClient();
  const [{ data, error }, policies] = await Promise.all([
    supabase
      .from("exhibitions")
      .select("id, title, start_date, end_date, image_url, official_url, venues!inner(name, address)")
      .eq("id", id)
      .maybeSingle(),
    loadSitePolicies(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return {
    ...toFlyer(data as FlyerRow, policies),
    // 0025: リンクを禁じるサイトの公式ページへは、リンクを出さない。
    officialUrl: applySitePolicies({ officialUrl: data.official_url, imageUrl: null }, policies).officialUrl,
    venueAddress: data.venues.address,
  };
}

/** 閲覧者本人が「気になる」を付けた展示。本人以外の分は RLS で見えない（0015）。 */
export async function listMyInterests(): Promise<FlyerData[]> {
  const supabase = await createClient();
  const [{ data, error }, policies] = await Promise.all([
    supabase.from("interests").select(`exhibitions!inner(${FLYER_COLUMNS})`).order("created_at", { ascending: false }),
    loadSitePolicies(),
  ]);
  if (error) throw error;
  return data.map((row) => toFlyer(row.exhibitions as unknown as FlyerRow, policies));
}

export async function listMyInterestIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("interests").select("exhibition_id");
  if (error) throw error;
  return new Set(data.map((row) => row.exhibition_id));
}

/** 閲覧者のユーザー id。まだ「気になる」を一度も押していなければ null（0019）。 */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}
