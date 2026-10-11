import { type ExtractedExhibition, matchExhibition, normalizeTitle } from "@/domain/exhibition-matching";
import type { LocalDate } from "@/domain/period";
import { parseHTML } from "linkedom";
import type { CrawlStore, CrawlSummary, CrawlTarget, DuplicateJudge, Link, LinkSelector } from "./crawl-ports";
import type { ExhibitionExtractor, PageFetcher } from "./ports";
import { readPage } from "./read-page";

export type CrawlDeps = {
  fetcher: PageFetcher;
  linkSelector: LinkSelector;
  extractor: ExhibitionExtractor;
  duplicateJudge: DuplicateJudge;
  store: CrawlStore;
};

/** 会場1つの巡回（0010, 0011, 0022）。 */
export async function crawlVenue(target: CrawlTarget, deps: CrawlDeps, today: LocalDate): Promise<CrawlSummary> {
  const summary: CrawlSummary = { skipped: null, created: 0, linked: 0, updated: 0, ignored: 0 };
  if (target.termsReviewedAt === null) return { ...summary, skipped: "terms_not_reviewed" };

  const listing = await deps.fetcher.fetch(target.listingUrl);
  if (listing.kind === "robots_disallowed") return { ...summary, skipped: "robots_disallowed" };
  if (listing.kind === "failed") return { ...summary, skipped: "fetch_failed" };

  const listingPage = readPage(listing.html, listing.finalUrl);
  if (listingPage.contentHash === target.lastListingHash) return { ...summary, skipped: "listing_unchanged" };

  const detailUrls = await deps.linkSelector.select({
    listingUrl: listing.finalUrl,
    links: sameSiteLinks(listing.html, listing.finalUrl),
  });

  for (const url of detailUrls) {
    const outcome = await crawlDetailPage(url, target, deps, today);
    summary[outcome]++;
  }

  await deps.store.recordListingCrawl(target.id, listingPage.contentHash);
  return summary;
}

type PageOutcome = "created" | "linked" | "updated" | "ignored";

async function crawlDetailPage(
  url: string,
  target: CrawlTarget,
  deps: CrawlDeps,
  today: LocalDate,
): Promise<PageOutcome> {
  const known = await deps.store.findSource(url);
  // 0010: 会期が終わった展示のページは、もう取得しない。
  if (known && known.endDate < today) return "ignored";

  const fetched = await deps.fetcher.fetch(url);
  if (fetched.kind !== "ok") return "ignored";

  const page = readPage(fetched.html, fetched.finalUrl);
  // 0010: 主要部分が前回と同じなら、抽出し直さない。展示ではなかったページも同じ。
  if (known && known.contentHash === page.contentHash) return "ignored";
  if ((await deps.store.findNonExhibitionPageHash(url)) === page.contentHash) return "ignored";

  const extraction = await deps.extractor.extract({ url: fetched.finalUrl, mainText: page.mainText });
  if (!extraction.isExhibitionPage) {
    await deps.store.markNonExhibitionPage(url, page.contentHash);
    return "ignored";
  }
  // 他館での巡回展の案内などを、巡回対象の会場の展示として取り違えない。
  if (!sameVenueName(extraction.venueName, target.venueName)) return "ignored";

  if (known) {
    await deps.store.updateExhibition(known.exhibitionId, {
      title: extraction.title,
      startDate: extraction.startDate,
      endDate: extraction.endDate,
      imageUrl: page.imageUrl,
    });
    await deps.store.updateSourceHash(url, page.contentHash);
    return "updated";
  }

  const link = await resolveDuplicate(extraction, target.venueId, deps);
  const exhibitionId =
    link?.exhibitionId ??
    (await deps.store.createExhibition({
      venueId: target.venueId,
      title: extraction.title,
      startDate: extraction.startDate,
      endDate: extraction.endDate,
      imageUrl: page.imageUrl,
      officialUrl: fetched.finalUrl,
    }));
  await deps.store.addSource({
    exhibitionId,
    url: fetched.finalUrl,
    origin: "crawl",
    // 巡回対象の一覧と同じサイトのページなので、出どころは会場（0016, 0022）。
    publisher: "venue",
    contentHash: page.contentHash,
    rawVenueName: extraction.venueName,
    matchReason: link?.matchReason ?? null,
    registeredBy: null,
  });
  return link ? "linked" : "created";
}

/** 照合（0003）。名前が一致しない候補は、巡回では LLM が判定する（0006）。 */
async function resolveDuplicate(
  extracted: ExtractedExhibition,
  venueId: string,
  deps: CrawlDeps,
): Promise<{ exhibitionId: string; matchReason: string | null } | null> {
  const match = matchExhibition(extracted, {
    knownExhibitionId: null,
    candidatesAtVenue: await deps.store.listExhibitionsAtVenue(venueId),
  });
  if (match.kind === "matched") return { exhibitionId: match.exhibitionId, matchReason: null };
  if (match.kind !== "ambiguous") return null;

  const verdict = await deps.duplicateJudge.judge({ extracted, candidates: match.candidates });
  const chosen = match.candidates.find((candidate) => candidate.id === verdict.sameAsExhibitionId);
  return chosen ? { exhibitionId: chosen.id, matchReason: `LLM: ${verdict.reason}` } : null;
}

/** 一覧ページの、同じサイト内のリンク（0022）。LLM には HTML 全体ではなくこれだけを渡す。 */
function sameSiteLinks(html: string, pageUrl: string): Link[] {
  const { document } = parseHTML(html);
  const host = hostOf(pageUrl);
  const links = new Map<string, Link>();
  for (const anchor of document.querySelectorAll("a[href]")) {
    let url: URL;
    try {
      url = new URL(anchor.getAttribute("href")!, pageUrl);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || hostOf(url.toString()) !== host) continue;
    url.hash = "";
    const key = url.toString();
    if (!links.has(key)) links.set(key, { text: anchor.textContent?.trim() ?? "", url: key });
  }
  return [...links.values()];
}

function sameVenueName(a: string, b: string): boolean {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  return x.includes(y) || y.includes(x);
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}
