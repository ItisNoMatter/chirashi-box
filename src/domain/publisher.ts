export type PublisherContext = {
  /** Google Places から得た会場の公式サイト。 */
  venueWebsiteUrl: string | null;
  /** まとめサイトなど、URL登録で即座に断るドメイン。 */
  blockedDomains: string[];
};

/**
 * ページを出したのが誰かを、決定的に判定できる範囲で判定する（0016）。
 * "needs_llm" は、抽出と同じ LLM の呼び出しで publisher を判定させることを表す。
 */
export type PublisherClassification = "venue" | "blocked" | "needs_llm";

export function classifyPublisher(url: string, context: PublisherContext): PublisherClassification {
  if (context.venueWebsiteUrl !== null) {
    if (hostOf(url) === hostOf(context.venueWebsiteUrl)) {
      return "venue";
    }
  }
  const host = new URL(url).hostname;
  if (context.blockedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return "blocked";
  }
  return "needs_llm";
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}
