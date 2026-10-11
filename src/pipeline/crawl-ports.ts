import type { CandidateExhibition, ExtractedExhibition } from "@/domain/exhibition-matching";
import type { LocalDate } from "@/domain/period";
import type { NewExhibition, NewSource } from "./ports";

/** 巡回対象（0009）。 */
export type CrawlTarget = {
  id: string;
  venueId: string;
  venueName: string;
  listingUrl: string;
  lastListingHash: string | null;
  /** 巡回対象に加える前に、人が利用規約を確認した日時（0016）。 */
  termsReviewedAt: Date | null;
};

export type Link = { text: string; url: string };

/** 一覧ページのリンクから、個別の展示ページを選ぶ（0022）。 */
export interface LinkSelector {
  select(input: { listingUrl: string; links: Link[] }): Promise<string[]>;
}

/** 名前が一致しない重複候補を判定する（0006）。 */
export interface DuplicateJudge {
  judge(input: {
    extracted: ExtractedExhibition;
    candidates: CandidateExhibition[];
  }): Promise<{ sameAsExhibitionId: string | null; reason: string }>;
}

export type KnownSource = {
  exhibitionId: string;
  contentHash: string | null;
  endDate: LocalDate;
};

export interface CrawlStore {
  findSource(url: string): Promise<KnownSource | null>;
  /** 展示ではないと判定したページの、そのときのハッシュ。 */
  findNonExhibitionPageHash(url: string): Promise<string | null>;
  markNonExhibitionPage(url: string, contentHash: string): Promise<void>;
  listExhibitionsAtVenue(venueId: string): Promise<CandidateExhibition[]>;
  createExhibition(exhibition: NewExhibition): Promise<string>;
  updateExhibition(
    id: string,
    fields: { title: string; startDate: LocalDate; endDate: LocalDate; imageUrl: string | null },
  ): Promise<void>;
  addSource(source: NewSource): Promise<void>;
  updateSourceHash(url: string, contentHash: string): Promise<void>;
  recordListingCrawl(targetId: string, listingHash: string): Promise<void>;
}

export type CrawlSummary = {
  skipped: "terms_not_reviewed" | "robots_disallowed" | "fetch_failed" | "listing_unchanged" | null;
  created: number;
  linked: number;
  updated: number;
  ignored: number;
};
