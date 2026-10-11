import { type CandidateExhibition, type ExtractedExhibition, matchExhibition } from "@/domain/exhibition-matching";
import { areaOf } from "@/domain/area";
import { classifyPublisher } from "@/domain/publisher";
import type {
  ExhibitionExtractor,
  PageFetcher,
  PlaceSearch,
  RegistrationStore,
  RegistrationUser,
  VenueCandidate,
} from "./ports";
import { readPage } from "./read-page";

export type RegistrationDeps = {
  fetcher: PageFetcher;
  extractor: ExhibitionExtractor;
  places: PlaceSearch;
  store: RegistrationStore;
  /** テストで時刻を差し替えるため。 */
  now?: () => Date;
};

/** 登録待ちの有効期限（0021）。 */
export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export type RejectionReason =
  | "email_required"
  | "blocked"
  | "robots_disallowed"
  | "fetch_failed"
  | "not_an_exhibition"
  | "third_party";

export type StartResult =
  | { kind: "rejected"; reason: RejectionReason }
  | { kind: "already_registered"; exhibitionId: string }
  | {
      kind: "needs_confirmation";
      pendingId: string;
      venueCandidates: VenueCandidate[];
      /** 最有力の会場候補で照合したときに、判断を保留した重複候補（0006）。 */
      duplicateCandidates: CandidateExhibition[];
    };

/** URL 登録の開始。抽出して「登録待ち」を作り、登録者に確かめてもらう候補を返す（0005, 0006, 0021）。 */
export async function startUrlRegistration(
  url: string,
  user: RegistrationUser,
  deps: RegistrationDeps,
): Promise<StartResult> {
  if (!user.hasEmail) return { kind: "rejected", reason: "email_required" };

  const knownExhibitionId = await deps.store.findExhibitionIdBySourceUrl(url);
  if (knownExhibitionId !== null) return { kind: "already_registered", exhibitionId: knownExhibitionId };

  const blockedDomains = await deps.store.listBlockedDomains();
  if (classifyPublisher(url, { venueWebsiteUrl: null, blockedDomains }) === "blocked") {
    return { kind: "rejected", reason: "blocked" };
  }

  const fetched = await deps.fetcher.fetch(url);
  if (fetched.kind === "robots_disallowed") return { kind: "rejected", reason: "robots_disallowed" };
  // JSON を受け取るのは巡回の一覧だけ（0026）。登録には HTML のページを求める。
  if (fetched.kind === "failed" || fetched.format === "json") return { kind: "rejected", reason: "fetch_failed" };

  const page = readPage(fetched.html, fetched.finalUrl);
  const extraction = await deps.extractor.extract({ url: fetched.finalUrl, mainText: page.mainText });
  if (!extraction.isExhibitionPage) return { kind: "rejected", reason: "not_an_exhibition" };

  const venueCandidates = await deps.places.searchVenue({
    name: extraction.venueName,
    address: extraction.venueAddress,
  });

  // 0016: 会場の公式サイトと同じホストなら決定的に「会場」。そうでなければ LLM の判定に従う。
  const isVenueSite = venueCandidates.some(
    (candidate) =>
      classifyPublisher(fetched.finalUrl, { venueWebsiteUrl: candidate.websiteUrl, blockedDomains }) === "venue",
  );
  const publisher = isVenueSite ? "venue" : extraction.publisher;
  if (publisher === "third_party") return { kind: "rejected", reason: "third_party" };

  const pendingId = await deps.store.createPendingRegistration({
    userId: user.id,
    url: fetched.finalUrl,
    contentHash: page.contentHash,
    imageUrl: page.imageUrl,
    extraction,
    publisher,
  });

  return {
    kind: "needs_confirmation",
    pendingId,
    venueCandidates,
    duplicateCandidates: await ambiguousDuplicatesAt(venueCandidates[0], extraction, deps.store),
  };
}

async function ambiguousDuplicatesAt(
  venue: VenueCandidate | undefined,
  extracted: ExtractedExhibition,
  store: RegistrationStore,
): Promise<CandidateExhibition[]> {
  if (!venue) return [];
  const venueId = await store.findVenueIdByPlaceId(venue.placeId);
  if (venueId === null) return [];
  const match = matchExhibition(extracted, {
    knownExhibitionId: null,
    candidatesAtVenue: await store.listExhibitionsAtVenue(venueId),
  });
  return match.kind === "ambiguous" ? match.candidates : [];
}

export type ConfirmChoice = {
  /** 登録者が確かめた（または選び直した）会場。 */
  placeId: string;
  /**
   * 重複の候補への答え。展示の id なら「その展示と同じ」、null なら「どれとも違う」、
   * 省略は「まだ答えていない」（0006）。
   */
  sameAsExhibitionId?: string | null;
};

export type ConfirmResult =
  | { kind: "registered"; exhibitionId: string }
  | { kind: "needs_duplicate_choice"; duplicateCandidates: CandidateExhibition[] }
  | { kind: "rejected"; reason: "not_found" | "expired" | "invalid_venue" | "invalid_choice" };

/** URL 登録の確定（0021）。 */
export async function confirmUrlRegistration(
  pendingId: string,
  choice: ConfirmChoice,
  user: RegistrationUser,
  deps: RegistrationDeps,
): Promise<ConfirmResult> {
  const pending = await deps.store.getPendingRegistration(pendingId);
  if (pending === null || pending.userId !== user.id) return { kind: "rejected", reason: "not_found" };
  const now = deps.now?.() ?? new Date();
  if (now.getTime() - pending.createdAt.getTime() > PENDING_TTL_MS) return { kind: "rejected", reason: "expired" };
  if ((await deps.places.getVenue(choice.placeId)) === null) return { kind: "rejected", reason: "invalid_venue" };

  const { extraction } = pending;
  const venueId =
    (await deps.store.findVenueIdByPlaceId(choice.placeId)) ??
    (await deps.store.createVenue({
      placeId: choice.placeId,
      // 0020: 会場の名前と住所は Places ではなく、館のページから抜き出したものを入れる。
      name: extraction.venueName,
      address: extraction.venueAddress,
      ...areaOf(extraction.venueAddress),
    }));

  const match = matchExhibition(extraction, {
    knownExhibitionId: await deps.store.findExhibitionIdBySourceUrl(pending.url),
    candidatesAtVenue: await deps.store.listExhibitionsAtVenue(venueId),
  });

  // 登録待ちを作った後に、同じ URL が別経路で登録されていた場合。
  if (match.kind === "known") {
    await deps.store.deletePendingRegistration(pending.id);
    return { kind: "registered", exhibitionId: match.exhibitionId };
  }

  let linkTo: { exhibitionId: string; matchReason: string | null } | null = null;
  if (match.kind === "matched") {
    linkTo = { exhibitionId: match.exhibitionId, matchReason: null };
  } else if (match.kind === "ambiguous") {
    // 0006: URL 登録では、名前が一致しない重複候補は登録者が判定する。
    if (choice.sameAsExhibitionId === undefined) {
      return { kind: "needs_duplicate_choice", duplicateCandidates: match.candidates };
    }
    if (choice.sameAsExhibitionId !== null) {
      if (!match.candidates.some((candidate) => candidate.id === choice.sameAsExhibitionId)) {
        return { kind: "rejected", reason: "invalid_choice" };
      }
      linkTo = { exhibitionId: choice.sameAsExhibitionId, matchReason: "登録者が同じ展示だと確認した" };
    }
  }

  const exhibitionId =
    linkTo?.exhibitionId ??
    (await deps.store.createExhibition({
      venueId,
      title: extraction.title,
      startDate: extraction.startDate,
      endDate: extraction.endDate,
      imageUrl: pending.imageUrl,
      officialUrl: pending.url,
    }));

  await deps.store.addSource({
    exhibitionId,
    url: pending.url,
    origin: "user",
    publisher: pending.publisher,
    contentHash: pending.contentHash,
    rawVenueName: extraction.venueName,
    matchReason: linkTo?.matchReason ?? null,
    registeredBy: user.id,
  });
  await deps.store.deletePendingRegistration(pending.id);

  return { kind: "registered", exhibitionId };
}
