import { describe, expect, it } from "vitest";
import { flyerImageOf } from "./flyer-image";

describe("flyerImageOf", () => {
  const shared = new Set(["https://museum.example/common/sns_logo.jpg"]);

  it("ほかの展示と同じ画像（サイト共通のロゴなど）は、チラシとして出さない（0029）", () => {
    expect(flyerImageOf("https://museum.example/common/sns_logo.jpg", shared)).toBeNull();
  });

  it("その展示だけの画像は、そのまま出す", () => {
    expect(flyerImageOf("https://museum.example/poster/light.jpg", shared)).toBe("https://museum.example/poster/light.jpg");
  });

  it("画像がなければ null のまま", () => {
    expect(flyerImageOf(null, shared)).toBeNull();
  });
});
