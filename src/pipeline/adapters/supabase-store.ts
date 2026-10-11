import "server-only";
import { normalizeTitle } from "@/domain/exhibition-matching";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { NewExhibition, NewSource, NewVenue, PendingRegistration, RegistrationStore } from "../ports";

export class SupabaseRegistrationStore implements RegistrationStore {
  private readonly db = createAdminClient();

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
