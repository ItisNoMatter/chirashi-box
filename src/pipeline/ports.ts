import type { CandidateExhibition } from "@/domain/exhibition-matching";
import type { LocalDate } from "@/domain/period";

/** robots.txt を確かめてからページを取得する（0016）。 */
export interface PageFetcher {
  fetch(url: string): Promise<FetchResult>;
}

export type FetchResult =
  /** format: "json" は、一覧を JSON で配るサイトの一覧（巡回のみ）。省略時は HTML。 */
  | { kind: "ok"; html: string; finalUrl: string; format?: "json" }
  | { kind: "robots_disallowed" }
  | { kind: "failed" };

/** LLM による構造化抽出（0012）。解説文は抜き出さない（0016）。 */
export interface ExhibitionExtractor {
  extract(input: { url: string; mainText: string }): Promise<Extraction>;
}

export type Extraction =
  | { isExhibitionPage: false }
  | {
      isExhibitionPage: true;
      title: string;
      startDate: LocalDate;
      endDate: LocalDate;
      venueName: string;
      venueAddress: string | null;
      publisher: "venue" | "organizer" | "third_party";
    };

/**
 * Google Places で会場を探す。返す名前・住所・Webサイトは確認の表示と判定にだけ使い、保存しない（0020）。
 */
export interface PlaceSearch {
  searchVenue(input: { name: string; address: string | null }): Promise<VenueCandidate[]>;
  /** 登録者が自分で選び直した place_id が実在するか。 */
  getVenue(placeId: string): Promise<VenueCandidate | null>;
}

export type VenueCandidate = {
  placeId: string;
  displayName: string;
  formattedAddress: string | null;
  websiteUrl: string | null;
};

export type RegistrationUser = {
  id: string;
  /** メールを紐づけ済みか。URL 登録はメール紐づけ済みのアカウントだけ（0008）。 */
  hasEmail: boolean;
};

export type PendingRegistration = {
  id: string;
  userId: string;
  url: string;
  contentHash: string;
  imageUrl: string | null;
  extraction: Extract<Extraction, { isExhibitionPage: true }>;
  publisher: "venue" | "organizer";
  createdAt: Date;
};

/** URL 登録が読み書きする永続化の口。 */
export interface RegistrationStore {
  listBlockedDomains(): Promise<string[]>;
  findExhibitionIdBySourceUrl(url: string): Promise<string | null>;
  findVenueIdByPlaceId(placeId: string): Promise<string | null>;
  listExhibitionsAtVenue(venueId: string): Promise<CandidateExhibition[]>;
  createPendingRegistration(pending: Omit<PendingRegistration, "id" | "createdAt">): Promise<string>;
  getPendingRegistration(id: string): Promise<PendingRegistration | null>;
  deletePendingRegistration(id: string): Promise<void>;
  createVenue(venue: NewVenue): Promise<string>;
  createExhibition(exhibition: NewExhibition): Promise<string>;
  addSource(source: NewSource): Promise<void>;
}

export type NewVenue = {
  placeId: string;
  name: string;
  address: string | null;
  prefecture: string | null;
  municipality: string | null;
};

export type NewExhibition = {
  venueId: string;
  title: string;
  startDate: LocalDate;
  endDate: LocalDate;
  imageUrl: string | null;
  officialUrl: string;
};

export type NewSource = {
  exhibitionId: string;
  url: string;
  origin: "crawl" | "user";
  publisher: "venue" | "organizer";
  contentHash: string;
  rawVenueName: string;
  /** 名前が一致しない候補に統合したときの根拠（0006）。 */
  matchReason: string | null;
  registeredBy: string | null;
};
