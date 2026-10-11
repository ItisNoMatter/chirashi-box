import { describe, expect, it } from "vitest";
import { FakeExtractor, FakePageFetcher, FakePlaceSearch, InMemoryRegistrationStore } from "./fakes";
import type { Extraction, VenueCandidate } from "./ports";
import { confirmUrlRegistration, startUrlRegistration } from "./url-registration";

const PAGE_URL = "https://exhibition-special.example/light";

const html = `<!doctype html><html><head>
<meta property="og:image" content="https://exhibition-special.example/og.jpg"></head>
<body><main><article><h1>光と影のあいだ</h1>
<p>会期：2026年9月1日〜2026年10月14日。会場：みなと現代美術館。</p>
<p>光と影をテーマにした現代美術の作品を、国内外の作家12人の新作とともに紹介します。</p>
</article></main></body></html>`;

const extraction: Extraction = {
  isExhibitionPage: true,
  title: "光と影のあいだ",
  startDate: "2026-09-01",
  endDate: "2026-10-14",
  venueName: "みなと現代美術館",
  venueAddress: "東京都港区架空1-1",
  publisher: "organizer",
};

const venue: VenueCandidate = {
  placeId: "place-minato",
  displayName: "みなと現代美術館",
  formattedAddress: "東京都港区架空1-1",
  websiteUrl: "https://minato-moca.example/",
};

const emailUser = { id: "user-1", hasEmail: true };

function setup(overrides: { extraction?: Extraction; venues?: VenueCandidate[] } = {}) {
  const store = new InMemoryRegistrationStore();
  const deps = {
    fetcher: new FakePageFetcher({ [PAGE_URL]: { kind: "ok", html, finalUrl: PAGE_URL } }),
    extractor: new FakeExtractor(overrides.extraction ?? extraction),
    places: new FakePlaceSearch(overrides.venues ?? [venue]),
    store,
  };
  return { deps, store };
}

describe("startUrlRegistration", () => {
  it("メールを紐づけていないユーザーは、ページを取得せずに断る", async () => {
    const { deps } = setup();

    const result = await startUrlRegistration(PAGE_URL, { id: "anon", hasEmail: false }, deps);

    expect(result).toEqual({ kind: "rejected", reason: "email_required" });
    expect(deps.fetcher.fetched).toEqual([]);
  });

  it("すでに取得元として知っている URL は、抽出せずに既存の展示を返す", async () => {
    const { deps, store } = setup();
    store.sources.set(PAGE_URL, "exhibition-1");

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({ kind: "already_registered", exhibitionId: "exhibition-1" });
    expect(deps.extractor.calls).toBe(0);
  });

  it("拒否リストのドメインは、ページを取得する前に断る", async () => {
    const { deps, store } = setup();
    store.blockedDomains = ["exhibition-special.example"];

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({ kind: "rejected", reason: "blocked" });
    expect(deps.fetcher.fetched).toEqual([]);
  });

  it("robots.txt で禁止されたページは、抽出せずに断る", async () => {
    const { deps } = setup();
    deps.fetcher = new FakePageFetcher({ [PAGE_URL]: { kind: "robots_disallowed" } });

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({ kind: "rejected", reason: "robots_disallowed" });
    expect(deps.extractor.calls).toBe(0);
  });

  it("展示のページでなければ断る", async () => {
    const { deps } = setup({ extraction: { isExhibitionPage: false } });

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({ kind: "rejected", reason: "not_an_exhibition" });
  });

  it("LLM が第三者のページと判定し、会場の公式サイトとも一致しなければ断る", async () => {
    const { deps } = setup({ extraction: { ...extraction, publisher: "third_party" } as Extraction });

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({ kind: "rejected", reason: "third_party" });
  });

  it("会場の公式サイトと同じホストなら、LLM の判定より優先して会場のページとして扱う", async () => {
    const { deps, store } = setup({
      extraction: { ...extraction, publisher: "third_party" } as Extraction,
      venues: [{ ...venue, websiteUrl: "https://www.exhibition-special.example/" }],
    });

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result.kind).toBe("needs_confirmation");
    expect(store.pending[0].publisher).toBe("venue");
  });

  it("抽出結果と画像を登録待ちに保存し、登録者に確かめてもらう会場の候補を返す", async () => {
    const { deps, store } = setup();

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toEqual({
      kind: "needs_confirmation",
      pendingId: "pending-1",
      venueCandidates: [venue],
      duplicateCandidates: [],
    });
    expect(store.pending[0]).toMatchObject({
      userId: "user-1",
      url: PAGE_URL,
      imageUrl: "https://exhibition-special.example/og.jpg",
      extraction,
      publisher: "organizer",
    });
  });

  it("最有力の会場に、会期が重なり展示名が一致しない展示があれば、重複の候補として返す", async () => {
    const { deps, store } = setup();
    store.venues.set("place-minato", { id: "venue-1", name: "みなと現代美術館", address: null });
    const similar = { id: "e1", title: "光と影 現代美術の12人", startDate: "2026-09-01", endDate: "2026-10-14" };
    store.exhibitions.push({ ...similar, venueId: "venue-1" });

    const result = await startUrlRegistration(PAGE_URL, emailUser, deps);

    expect(result).toMatchObject({ kind: "needs_confirmation", duplicateCandidates: [similar] });
  });
});

describe("confirmUrlRegistration", () => {
  async function started(overrides: Parameters<typeof setup>[0] = {}) {
    const context = setup(overrides);
    const result = await startUrlRegistration(PAGE_URL, emailUser, context.deps);
    if (result.kind !== "needs_confirmation") throw new Error("前提が崩れている");
    return { ...context, pendingId: result.pendingId };
  }

  it("本人以外の登録待ちは確定できない", async () => {
    const { deps, pendingId } = await started();

    const result = await confirmUrlRegistration(
      pendingId,
      { placeId: "place-minato" },
      { id: "someone-else", hasEmail: true },
      deps,
    );

    expect(result).toEqual({ kind: "rejected", reason: "not_found" });
  });

  it("未知の会場なら place_id で作り、名前と住所は抽出結果から入れて、新しい展示として登録する", async () => {
    const { deps, store, pendingId } = await started();

    const result = await confirmUrlRegistration(pendingId, { placeId: "place-minato" }, emailUser, deps);

    expect(result).toEqual({ kind: "registered", exhibitionId: "exhibition-new-1" });
    expect(store.createdVenues).toEqual([
      {
        placeId: "place-minato",
        name: "みなと現代美術館",
        address: "東京都港区架空1-1",
        prefecture: "東京都",
        municipality: "港区",
      },
    ]);
    expect(store.createdExhibitions[0]).toMatchObject({
      title: "光と影のあいだ",
      startDate: "2026-09-01",
      endDate: "2026-10-14",
      imageUrl: "https://exhibition-special.example/og.jpg",
      officialUrl: PAGE_URL,
    });
    expect(store.addedSources[0]).toMatchObject({
      exhibitionId: "exhibition-new-1",
      url: PAGE_URL,
      origin: "user",
      publisher: "organizer",
      rawVenueName: "みなと現代美術館",
      registeredBy: "user-1",
    });
    expect(store.pending).toEqual([]);
  });

  it("既知の会場なら会場を作らず、表示名も上書きしない", async () => {
    const { deps, store, pendingId } = await started();
    store.venues.set("place-minato", { id: "venue-1", name: "みなと現代美術館（MoCA）", address: null });

    await confirmUrlRegistration(pendingId, { placeId: "place-minato" }, emailUser, deps);

    expect(store.createdVenues).toEqual([]);
    expect(store.venues.get("place-minato")?.name).toBe("みなと現代美術館（MoCA）");
    expect(store.createdExhibitions[0].venueId).toBe("venue-1");
  });

  it("同じ会場に展示名が一致する展示があれば、新しく作らず取得元だけを紐づける", async () => {
    const { deps, store, pendingId } = await started();
    store.venues.set("place-minato", { id: "venue-1", name: "みなと現代美術館", address: null });
    store.exhibitions.push({ id: "e1", title: "光と影のあいだ", startDate: "2026-09-01", endDate: "2026-10-14", venueId: "venue-1" });

    const result = await confirmUrlRegistration(pendingId, { placeId: "place-minato" }, emailUser, deps);

    expect(result).toEqual({ kind: "registered", exhibitionId: "e1" });
    expect(store.createdExhibitions).toEqual([]);
    expect(store.addedSources[0]).toMatchObject({ exhibitionId: "e1", url: PAGE_URL });
  });

  it("作成から24時間を過ぎた登録待ちは確定できない", async () => {
    const { deps, store, pendingId } = await started();
    const createdAt = store.pending[0].createdAt;
    const later = { ...deps, now: () => new Date(createdAt.getTime() + 24 * 60 * 60 * 1000 + 1) };

    const result = await confirmUrlRegistration(pendingId, { placeId: "place-minato" }, emailUser, later);

    expect(result).toEqual({ kind: "rejected", reason: "expired" });
    expect(store.addedSources).toEqual([]);
  });

  it("Places に実在しない place_id は受け付けない", async () => {
    const { deps, store, pendingId } = await started();

    const result = await confirmUrlRegistration(pendingId, { placeId: "made-up" }, emailUser, deps);

    expect(result).toEqual({ kind: "rejected", reason: "invalid_venue" });
    expect(store.createdVenues).toEqual([]);
  });

  describe("会期が重なるのに展示名が一致しない候補があるとき（0006）", () => {
    const similar = { id: "e1", title: "光と影 現代美術の12人", startDate: "2026-09-01", endDate: "2026-10-14" };

    async function startedWithSimilar() {
      const context = await started();
      context.store.venues.set("place-minato", { id: "venue-1", name: "みなと現代美術館", address: null });
      context.store.exhibitions.push({ ...similar, venueId: "venue-1" });
      return context;
    }

    it("登録者がまだ答えていなければ、候補を返して答えを求める", async () => {
      const { deps, store, pendingId } = await startedWithSimilar();

      const result = await confirmUrlRegistration(pendingId, { placeId: "place-minato" }, emailUser, deps);

      expect(result).toEqual({ kind: "needs_duplicate_choice", duplicateCandidates: [similar] });
      expect(store.addedSources).toEqual([]);
      expect(store.pending).toHaveLength(1);
    });

    it("登録者が同じ展示だと答えたら、その展示に紐づけ、根拠を残す", async () => {
      const { deps, store, pendingId } = await startedWithSimilar();

      const result = await confirmUrlRegistration(
        pendingId,
        { placeId: "place-minato", sameAsExhibitionId: "e1" },
        emailUser,
        deps,
      );

      expect(result).toEqual({ kind: "registered", exhibitionId: "e1" });
      expect(store.addedSources[0].matchReason).toBe("登録者が同じ展示だと確認した");
    });

    it("登録者がどれとも違うと答えたら、新しい展示として登録する", async () => {
      const { deps, pendingId } = await startedWithSimilar();

      const result = await confirmUrlRegistration(
        pendingId,
        { placeId: "place-minato", sameAsExhibitionId: null },
        emailUser,
        deps,
      );

      expect(result).toEqual({ kind: "registered", exhibitionId: "exhibition-new-1" });
    });

    it("候補にない展示を同じだと答えても受け付けない", async () => {
      const { deps, pendingId } = await startedWithSimilar();

      const result = await confirmUrlRegistration(
        pendingId,
        { placeId: "place-minato", sameAsExhibitionId: "unrelated" },
        emailUser,
        deps,
      );

      expect(result).toEqual({ kind: "rejected", reason: "invalid_choice" });
    });
  });
});
