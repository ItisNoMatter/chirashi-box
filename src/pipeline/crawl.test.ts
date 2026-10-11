import { describe, expect, it } from "vitest";
import type { CrawlTarget } from "./crawl-ports";
import { crawlVenue } from "./crawl";
import {
  FakeDuplicateJudge,
  FakeExtractorByUrl,
  FakeLinkSelector,
  FakePageFetcher,
  InMemoryCrawlStore,
} from "./fakes";
import type { Extraction, FetchResult } from "./ports";
import { readPage } from "./read-page";

// テスト用の架空のページ。実在の館のページは使わない（0018）。
const LISTING_URL = "https://minato-moca.example/exhibitions/";
const DETAIL_URL = "https://minato-moca.example/exhibitions/light.html";
const TODAY = "2026-10-11";

const listingHtml = (extra = "") => `<!doctype html><html><body>
<nav><a href="/">トップ</a><a href="/access">アクセス</a></nav>
<main><article><h1>展覧会一覧</h1>
<p>現在開催中の展覧会と、これから開催する展覧会のご案内です。各展覧会のページで詳細をご覧ください。</p>
<ul>
  <li><a href="/exhibitions/light.html">光と影のあいだ</a></li>
  ${extra}
</ul>
<p><a href="https://aggregator.example/event/1">外部のイベント情報</a></p>
</article></main></body></html>`;

const detailHtml = (period = "2026年9月1日〜2026年10月14日") => `<!doctype html><html>
<head><meta property="og:image" content="/img/light.jpg"></head>
<body><main><article><h1>光と影のあいだ</h1>
<p>会期：${period}。会場：みなと現代美術館。</p>
<p>光と影をテーマにした現代美術の作品を、国内外の作家12人の新作とともに紹介します。</p>
</article></main></body></html>`;

const ok = (html: string, finalUrl: string): FetchResult => ({ kind: "ok", html, finalUrl });

const extraction: Extraction = {
  isExhibitionPage: true,
  title: "光と影のあいだ",
  startDate: "2026-09-01",
  endDate: "2026-10-14",
  venueName: "みなと現代美術館",
  venueAddress: "東京都港区架空1-1",
  publisher: "venue",
};

const target: CrawlTarget = {
  id: "target-1",
  venueId: "venue-1",
  venueName: "みなと現代美術館",
  listingUrl: LISTING_URL,
  lastListingHash: null,
  termsReviewedAt: new Date("2026-10-01"),
};

function setup(
  options: {
    pages?: Record<string, FetchResult>;
    extractions?: Record<string, Extraction>;
    judge?: { sameAsExhibitionId: string | null; reason: string };
  } = {},
) {
  const store = new InMemoryCrawlStore();
  const deps = {
    fetcher: new FakePageFetcher(
      options.pages ?? {
        [LISTING_URL]: ok(listingHtml(), LISTING_URL),
        [DETAIL_URL]: ok(detailHtml(), DETAIL_URL),
      },
    ),
    linkSelector: new FakeLinkSelector(),
    extractor: new FakeExtractorByUrl(options.extractions ?? { [DETAIL_URL]: extraction }),
    duplicateJudge: new FakeDuplicateJudge(options.judge ?? { sameAsExhibitionId: null, reason: "" }),
    store,
  };
  return { deps, store };
}

describe("crawlVenue", () => {
  it("利用規約を確認していない巡回対象は、取得もせずに飛ばす", async () => {
    const { deps } = setup();

    const summary = await crawlVenue({ ...target, termsReviewedAt: null }, deps, TODAY);

    expect(summary.skipped).toBe("terms_not_reviewed");
    expect(deps.fetcher.fetched).toEqual([]);
  });

  it("robots.txt で禁止された一覧ページは、取得しない", async () => {
    const { deps, store } = setup({ pages: { [LISTING_URL]: { kind: "robots_disallowed" } } });

    const summary = await crawlVenue(target, deps, TODAY);

    expect(summary.skipped).toBe("robots_disallowed");
    expect(deps.linkSelector.received).toEqual([]);
    expect(store.listingCrawls).toEqual([]);
  });

  it("一覧ページの主要部分が前回と同じなら、LLM を一度も呼ばずに終える", async () => {
    const { deps } = setup();
    const lastListingHash = readPage(listingHtml(), LISTING_URL).contentHash;

    const summary = await crawlVenue({ ...target, lastListingHash }, deps, TODAY);

    expect(summary.skipped).toBe("listing_unchanged");
    expect(deps.linkSelector.received).toEqual([]);
    expect(deps.extractor.calledWith).toEqual([]);
  });

  it("一覧が変わったら、同じサイト内のリンクだけを、文字と絶対 URL の組で LLM に渡す", async () => {
    const { deps } = setup();

    await crawlVenue(target, deps, TODAY);

    expect(deps.linkSelector.received).toEqual([
      [
        { text: "トップ", url: "https://minato-moca.example/" },
        { text: "アクセス", url: "https://minato-moca.example/access" },
        { text: "光と影のあいだ", url: DETAIL_URL },
      ],
    ]);
  });

  it("新しい個別ページは抽出し、巡回対象の会場の新しい展示として、出どころを「会場」で登録する", async () => {
    const { deps, store } = setup();

    const summary = await crawlVenue(target, deps, TODAY);

    expect(summary).toMatchObject({ skipped: null, created: 1 });
    expect(store.exhibitions[0]).toMatchObject({
      venueId: "venue-1",
      title: "光と影のあいだ",
      startDate: "2026-09-01",
      endDate: "2026-10-14",
      imageUrl: "https://minato-moca.example/img/light.jpg",
      officialUrl: DETAIL_URL,
    });
    expect(store.addedSources[0]).toMatchObject({
      url: DETAIL_URL,
      origin: "crawl",
      publisher: "venue",
      contentHash: readPage(detailHtml(), DETAIL_URL).contentHash,
      registeredBy: null,
    });
  });

  describe("既知のページ（0010）", () => {
    function withKnownSource(store: InMemoryCrawlStore, contentHash: string, endDate = "2026-10-14") {
      store.exhibitions.push({ id: "e1", title: "光と影のあいだ", startDate: "2026-09-01", endDate, venueId: "venue-1" });
      store.sources.set(DETAIL_URL, { url: DETAIL_URL, exhibitionId: "e1", contentHash, endDate });
    }

    it("主要部分が前回と同じなら、抽出し直さない", async () => {
      const { deps, store } = setup();
      withKnownSource(store, readPage(detailHtml(), DETAIL_URL).contentHash);

      const summary = await crawlVenue(target, deps, TODAY);

      expect(deps.extractor.calledWith).not.toContain(DETAIL_URL);
      expect(summary.updated).toBe(0);
    });

    it("主要部分が変わっていたら抽出し直し、会期の延長などを展示に反映する", async () => {
      const extended = { ...extraction, endDate: "2026-10-25" } as Extraction;
      const { deps, store } = setup({
        pages: {
          [LISTING_URL]: ok(listingHtml(), LISTING_URL),
          [DETAIL_URL]: ok(detailHtml("2026年9月1日〜2026年10月25日（会期延長）"), DETAIL_URL),
        },
        extractions: { [DETAIL_URL]: extended },
      });
      withKnownSource(store, "old-hash");

      const summary = await crawlVenue(target, deps, TODAY);

      expect(summary.updated).toBe(1);
      expect(store.exhibitions[0].endDate).toBe("2026-10-25");
      expect(store.sources.get(DETAIL_URL)?.contentHash).not.toBe("old-hash");
    });

    it("会期が終わった展示のページは、取得もしない", async () => {
      const { deps, store } = setup();
      withKnownSource(store, "old-hash", "2026-10-10");

      await crawlVenue(target, deps, TODAY);

      expect(deps.fetcher.fetched).not.toContain(DETAIL_URL);
    });
  });

  it("展示ではなかったページは覚えておき、変わらない限り次からは抽出しない", async () => {
    const ACCESS_URL = "https://minato-moca.example/access";
    const accessHtml = "<html><body><main><article><h1>アクセス</h1><p>最寄り駅から徒歩5分です。駐車場はありませんので公共交通機関をご利用ください。</p></article></main></body></html>";
    const { deps, store } = setup({
      pages: { [LISTING_URL]: ok(listingHtml(), LISTING_URL), [ACCESS_URL]: ok(accessHtml, ACCESS_URL) },
      extractions: {},
    });
    deps.linkSelector = new FakeLinkSelector(() => [ACCESS_URL]);

    await crawlVenue(target, deps, TODAY);
    await crawlVenue(target, deps, TODAY);

    expect(deps.extractor.calledWith).toEqual([ACCESS_URL]);
    expect(store.nonExhibitionPages.get(ACCESS_URL)).toBe(readPage(accessHtml, ACCESS_URL).contentHash);
  });

  it("抽出した会場名が巡回対象の会場と一致しなければ（他館での巡回展の案内など）、登録しない", async () => {
    const { deps, store } = setup({
      extractions: { [DETAIL_URL]: { ...extraction, venueName: "よこはま写真館" } as Extraction },
    });

    const summary = await crawlVenue(target, deps, TODAY);

    expect(summary.created).toBe(0);
    expect(store.exhibitions).toEqual([]);
  });

  it("会場名の表記揺れ（展示室名つきなど）は、同じ会場とみなす", async () => {
    const { deps, store } = setup({
      extractions: { [DETAIL_URL]: { ...extraction, venueName: "みなと現代美術館 企画展示室" } as Extraction },
    });

    await crawlVenue(target, deps, TODAY);

    expect(store.exhibitions).toHaveLength(1);
  });

  describe("重複の照合（0003, 0006）", () => {
    const similar = { id: "e1", title: "光と影 現代美術の12人", startDate: "2026-09-01", endDate: "2026-10-14" };

    it("同じ会場に展示名が一致する展示があれば、新しく作らず取得元だけを紐づける", async () => {
      const { deps, store } = setup();
      store.exhibitions.push({ id: "e1", title: "光と影のあいだ", startDate: "2026-09-01", endDate: "2026-10-14", venueId: "venue-1" });

      const summary = await crawlVenue(target, deps, TODAY);

      expect(summary).toMatchObject({ created: 0, linked: 1 });
      expect(store.addedSources[0]).toMatchObject({ exhibitionId: "e1", matchReason: null });
      expect(deps.duplicateJudge.calls).toBe(0);
    });

    it("名前が一致しない候補は LLM が判定し、同じと判定したら根拠を残して紐づける", async () => {
      const { deps, store } = setup({ judge: { sameAsExhibitionId: "e1", reason: "会期と出品作家が一致する" } });
      store.exhibitions.push({ ...similar, venueId: "venue-1" });

      const summary = await crawlVenue(target, deps, TODAY);

      expect(summary).toMatchObject({ created: 0, linked: 1 });
      expect(store.addedSources[0]).toMatchObject({ exhibitionId: "e1", matchReason: "LLM: 会期と出品作家が一致する" });
    });

    it("LLM が別の展示と判定したら、新しい展示として登録する", async () => {
      const { deps, store } = setup({ judge: { sameAsExhibitionId: null, reason: "テーマが異なる" } });
      store.exhibitions.push({ ...similar, venueId: "venue-1" });

      const summary = await crawlVenue(target, deps, TODAY);

      expect(summary).toMatchObject({ created: 1, linked: 0 });
    });

    it("LLM が候補にない展示を答えたら、統合せず新しい展示として登録する", async () => {
      const { deps, store } = setup({ judge: { sameAsExhibitionId: "unrelated", reason: "?" } });
      store.exhibitions.push({ ...similar, venueId: "venue-1" });

      const summary = await crawlVenue(target, deps, TODAY);

      expect(summary).toMatchObject({ created: 1, linked: 0 });
    });
  });

  it("終わったら、一覧ページのハッシュを記録する", async () => {
    const { deps, store } = setup();

    await crawlVenue(target, deps, TODAY);

    expect(store.listingCrawls).toEqual([
      { targetId: "target-1", listingHash: readPage(listingHtml(), LISTING_URL).contentHash },
    ]);
  });
});
