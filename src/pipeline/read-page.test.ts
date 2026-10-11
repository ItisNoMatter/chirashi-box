import { describe, expect, it } from "vitest";
import { readPage } from "./read-page";

// テスト用の架空のページ。実在の館のページは使わない（0018）。
const page = ({ header = "", body = "", head = "" } = {}) => `<!doctype html>
<html lang="ja"><head><title>架空美術館</title>${head}</head>
<body>
  <header><nav><a href="/">トップ</a><a href="/access">アクセス</a></nav>${header}</header>
  <main><article>
    <h1>光と影のあいだ</h1>
    <p>会期：2026年9月1日（火）〜 2026年10月14日（水）。会場：みなと現代美術館 企画展示室。</p>
    <p>光と影をテーマにした現代美術の作品を、国内外の作家12人の新作とともに紹介する展覧会です。</p>
    ${body}
  </article></main>
  <footer>© 架空美術館 ・ プライバシーポリシー ・ お問い合わせ</footer>
</body></html>`;

describe("readPage", () => {
  it("本文の主要部分だけを取り出し、ナビゲーションやフッターは含めない", () => {
    const result = readPage(page(), "https://museum.example/ex/1");

    expect(result.mainText).toContain("会期：2026年9月1日");
    expect(result.mainText).not.toContain("アクセス");
    expect(result.mainText).not.toContain("プライバシーポリシー");
  });

  it("周辺（ヘッダーの日付表示）だけが変わっても、ハッシュは変わらない", () => {
    const monday = readPage(page({ header: "<p>本日 10月12日（月）は休館日です</p>" }), "https://museum.example/ex/1");
    const tuesday = readPage(page({ header: "<p>本日 10月13日（火）は開館しています</p>" }), "https://museum.example/ex/1");

    expect(monday.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tuesday.contentHash).toBe(monday.contentHash);
  });

  it("本文が変われば、ハッシュも変わる", () => {
    const before = readPage(page(), "https://museum.example/ex/1");
    const after = readPage(page({ body: "<p>会期を10月25日まで延長します。</p>" }), "https://museum.example/ex/1");

    expect(after.contentHash).not.toBe(before.contentHash);
  });

  it("og:image を、ページの URL を基準にした絶対 URL で返す", () => {
    const result = readPage(
      page({ head: '<meta property="og:image" content="/media/poster/2026_light.jpg">' }),
      "https://museum.example/ex/1",
    );

    expect(result.imageUrl).toBe("https://museum.example/media/poster/2026_light.jpg");
  });

  it("og:image がなければ、画像は null", () => {
    expect(readPage(page(), "https://museum.example/ex/1").imageUrl).toBeNull();
  });
});
