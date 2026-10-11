import "server-only";
import { normalizeTitle } from "@/domain/exhibition-matching";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { CrawlStore, CrawlTarget, KnownSource } from "../crawl-ports";
import type { NewExhibition, NewSource, NewVenue, PendingRegistration, RegistrationStore } from "../ports";

export class SupabaseRegistrationStore implements RegistrationStore {
  protected readonly db = createAdminClient();

  async listBlockedDomains() {
    const { data, error } = await this.db.from("blocked_domains").select("domain");
    if (error) throw error;
    return data.map((row) => row.domain);
  }

  async findExhibitionIdBySourceUrl(url: string) {
    const { data, error } = await this.db.from("exhibition_sources").select("exhibition_id").eq("url", url).maybeSingle();
    if (error) throw error;
    return data?.exhibition_id ?? null;
  }

  async findVenueIdByPlaceId(placeId: string) {
    const { data, error } = await this.db.from("venues").select("id").eq("place_id", placeId).maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  }

  async listExhibitionsAtVenue(venueId: string) {
    // 照合の候補は会期が重なるものだけなので、終わって久しい展示まで読む必要はない。
    const { data, error } = await this.db
      .from("exhibitions")
      .select("id, title, start_date, end_date")
      .eq("venue_id", venueId)
      .gte("end_date", oneYearAgo());
    if (error) throw error;
    return data.map((row) => ({ id: row.id, title: row.title, startDate: row.start_date, endDate: row.end_date }));
  }

  async createPendingRegistration(pending: Omit<PendingRegistration, "id" | "createdAt">) {
    const { data, error } = await this.db
      .from("pending_registrations")
      .insert({
        user_id: pending.userId,
        url: pending.url,
        content_hash: pending.contentHash,
        image_url: pending.imageUrl,
        extraction: pending.extraction as unknown as NonNullable<Json>,
        publisher: pending.publisher,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  async getPendingRegistration(id: string): Promise<PendingRegistration | null> {
    const { data, error } = await this.db.from("pending_registrations").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      url: data.url,
      contentHash: data.content_hash,
      imageUrl: data.image_url,
      extraction: data.extraction as unknown as PendingRegistration["extraction"],
      publisher: data.publisher as PendingRegistration["publisher"],
      createdAt: new Date(data.created_at),
    };
  }

  async deletePendingRegistration(id: string) {
    const { error } = await this.db.from("pending_registrations").delete().eq("id", id);
    if (error) throw error;
  }

  async createVenue(venue: NewVenue) {
    // 同じ place_id の会場が同時に作られても1つにまとまるよう upsert し、既存の表示名は上書きしない（0020）。
    const { error } = await this.db.from("venues").upsert(
      {
        place_id: venue.placeId,
        name: venue.name,
        address: venue.address,
        prefecture: venue.prefecture,
        municipality: venue.municipality,
      },
      { onConflict: "place_id", ignoreDuplicates: true },
    );
    if (error) throw error;
    const id = await this.findVenueIdByPlaceId(venue.placeId);
    if (!id) throw new Error("会場の作成に失敗しました");
    return id;
  }

  async createExhibition(exhibition: NewExhibition) {
    const { data, error } = await this.db
      .from("exhibitions")
      .insert({
        venue_id: exhibition.venueId,
        title: exhibition.title,
        normalized_title: normalizeTitle(exhibition.title),
        start_date: exhibition.startDate,
        end_date: exhibition.endDate,
        image_url: exhibition.imageUrl,
        official_url: exhibition.officialUrl,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  async addSource(source: NewSource) {
    const { error } = await this.db.from("exhibition_sources").insert({
      exhibition_id: source.exhibitionId,
      url: source.url,
      origin: source.origin,
      publisher: source.publisher,
      content_hash: source.contentHash,
      raw_venue_name: source.rawVenueName,
      match_reason: source.matchReason,
      registered_by: source.registeredBy,
      fetched_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

function oneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

/** 巡回用。展示と取得元の書き込みは URL 登録と共有する。 */
export class SupabaseCrawlStore extends SupabaseRegistrationStore implements CrawlStore {
  async listCrawlTargets(): Promise<CrawlTarget[]> {
    const { data, error } = await this.db
      .from("crawl_targets")
      .select("id, venue_id, listing_url, last_listing_hash, terms_reviewed_at, venues!inner(name)")
      .eq("enabled", true)
      .order("last_crawled_at", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      venueId: row.venue_id,
      venueName: row.venues.name,
      listingUrl: row.listing_url,
      lastListingHash: row.last_listing_hash,
      termsReviewedAt: row.terms_reviewed_at ? new Date(row.terms_reviewed_at) : null,
    }));
  }

  async findSource(url: string): Promise<KnownSource | null> {
    const { data, error } = await this.db
      .from("exhibition_sources")
      .select("exhibition_id, content_hash, exhibitions!inner(end_date)")
      .eq("url", url)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { exhibitionId: data.exhibition_id, contentHash: data.content_hash, endDate: data.exhibitions.end_date };
  }

  async findNonExhibitionPageHash(url: string) {
    const { data, error } = await this.db.from("crawled_pages").select("content_hash").eq("url", url).maybeSingle();
    if (error) throw error;
    return data?.content_hash ?? null;
  }

  async markNonExhibitionPage(url: string, contentHash: string) {
    const { error } = await this.db
      .from("crawled_pages")
      .upsert({ url, content_hash: contentHash, checked_at: new Date().toISOString() });
    if (error) throw error;
  }

  async updateExhibition(
    id: string,
    fields: { title: string; startDate: string; endDate: string; imageUrl: string | null },
  ) {
    const { error } = await this.db
      .from("exhibitions")
      .update({
        title: fields.title,
        normalized_title: normalizeTitle(fields.title),
        start_date: fields.startDate,
        end_date: fields.endDate,
        image_url: fields.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  }

  async updateSourceHash(url: string, contentHash: string) {
    const { error } = await this.db
      .from("exhibition_sources")
      .update({ content_hash: contentHash, fetched_at: new Date().toISOString() })
      .eq("url", url);
    if (error) throw error;
  }

  async recordListingCrawl(targetId: string, listingHash: string) {
    const { error } = await this.db
      .from("crawl_targets")
      .update({ last_listing_hash: listingHash, last_crawled_at: new Date().toISOString() })
      .eq("id", targetId);
    if (error) throw error;
  }

  /** 作成から一定時間を過ぎた登録待ちと、古い試行の記録を消す（0021）。 */
  async deleteStaleRegistrationData(pendingOlderThan: Date, attemptsOlderThan: Date) {
    const pending = await this.db.from("pending_registrations").delete().lt("created_at", pendingOlderThan.toISOString());
    if (pending.error) throw pending.error;
    const attempts = await this.db.from("registration_attempts").delete().lt("created_at", attemptsOlderThan.toISOString());
    if (attempts.error) throw attempts.error;
  }
}
