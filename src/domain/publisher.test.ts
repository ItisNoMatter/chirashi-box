import { describe, expect, it } from "vitest";
import { classifyPublisher } from "./publisher";

describe("classifyPublisher", () => {
  it("会場の公式サイトと同じホストのページは、会場が出したものとして扱う", () => {
    expect(
      classifyPublisher("https://www.tobikan.jp/exhibition/2026_orsay.html", {
        venueWebsiteUrl: "https://www.tobikan.jp/",
        blockedDomains: [],
      }),
    ).toBe("venue");
  });

  it("www の有無だけが違うホストも、会場の公式サイトとして扱う", () => {
    expect(
      classifyPublisher("https://artmuseum.example.jp/exhibitions/1", {
        venueWebsiteUrl: "https://www.artmuseum.example.jp",
        blockedDomains: [],
      }),
    ).toBe("venue");
  });

  it("拒否リストのドメインと、そのサブドメインのページは断る", () => {
    const context = { venueWebsiteUrl: null, blockedDomains: ["aggregator.example"] };
    expect(classifyPublisher("https://aggregator.example/event/123", context)).toBe("blocked");
    expect(classifyPublisher("https://www.aggregator.example/event/123", context)).toBe("blocked");
    expect(classifyPublisher("https://notaggregator.example/event/123", context)).toBe("needs_llm");
  });
});
