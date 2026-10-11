import { describe, expect, it } from "vitest";
import { applySitePolicies } from "./site-policy";

const exhibition = {
  officialUrl: "https://mimt.jp/ex/fontanesi/",
  imageUrl: "https://mimt.jp/img/fontanesi.jpg",
};

describe("applySitePolicies", () => {
  it("制限のないサイトなら、リンクも画像もそのまま出す", () => {
    expect(applySitePolicies(exhibition, [])).toEqual(exhibition);
  });

  it("リンクを禁じるサイトなら、公式ページへのリンクを外す", () => {
    const result = applySitePolicies(exhibition, [{ domain: "mimt.jp", allowLinks: false, allowImages: true }]);

    expect(result).toEqual({ ...exhibition, officialUrl: null });
  });

  it("画像の直接表示を禁じるサイトなら、画像を外す（自動生成のチラシになる）", () => {
    const result = applySitePolicies(
      { officialUrl: "https://www.nmwa.go.jp/jp/exhibitions/2026italy.html", imageUrl: "https://www.nmwa.go.jp/img/2026italy.jpg" },
      [{ domain: "nmwa.go.jp", allowLinks: true, allowImages: false }],
    );

    expect(result.imageUrl).toBeNull();
    expect(result.officialUrl).toBe("https://www.nmwa.go.jp/jp/exhibitions/2026italy.html");
  });

  it("画像が別のドメイン（CDN など）にあっても、出どころのページのサイトが禁じていれば外す", () => {
    const result = applySitePolicies(
      { officialUrl: "https://www.nmwa.go.jp/jp/exhibitions/2026italy.html", imageUrl: "https://cdn.example.net/2026italy.jpg" },
      [{ domain: "nmwa.go.jp", allowLinks: true, allowImages: false }],
    );

    expect(result.imageUrl).toBeNull();
  });

  it("リンクも画像も禁じるサイトでは、両方を外す", () => {
    const result = applySitePolicies(exhibition, [{ domain: "mimt.jp", allowLinks: false, allowImages: false }]);

    expect(result).toEqual({ officialUrl: null, imageUrl: null });
  });

  it("制限はサブドメインにも及び、似た名前の別ドメインには及ばない", () => {
    const policies = [{ domain: "mimt.jp", allowLinks: false, allowImages: false }];

    expect(applySitePolicies({ officialUrl: "https://www.mimt.jp/x", imageUrl: null }, policies).officialUrl).toBeNull();
    expect(applySitePolicies({ officialUrl: "https://notmimt.jp/x", imageUrl: null }, policies).officialUrl).toBe(
      "https://notmimt.jp/x",
    );
  });
});
