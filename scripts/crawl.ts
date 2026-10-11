/**
 * 日次の巡回（0011）。GitHub Actions の cron から実行する。
 *   npm run crawl
 * 会場1つずつ順に処理し、1つが失敗しても残りの会場は続ける。
 */
import { crawlVenue } from "@/pipeline/crawl";
import { ClaudeDuplicateJudge, ClaudeLinkSelector } from "@/pipeline/adapters/claude-crawl";
import { ClaudeExhibitionExtractor } from "@/pipeline/adapters/claude-extractor";
import { HttpPageFetcher } from "@/pipeline/adapters/http-fetcher";
import { SupabaseCrawlStore } from "@/pipeline/adapters/supabase-store";

const DAY_MS = 24 * 60 * 60 * 1000;

function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

async function main() {
  const store = new SupabaseCrawlStore();
  const deps = {
    fetcher: new HttpPageFetcher(),
    linkSelector: new ClaudeLinkSelector(),
    extractor: new ClaudeExhibitionExtractor(todayInTokyo),
    duplicateJudge: new ClaudeDuplicateJudge(),
    store,
  };

  const targets = await store.listCrawlTargets();
  console.log(`巡回対象: ${targets.length}件`);

  let failures = 0;
  for (const target of targets) {
    try {
      const summary = await crawlVenue(target, deps, todayInTokyo());
      console.log(`${target.venueName}: ${JSON.stringify(summary)}`);
    } catch (error) {
      failures++;
      console.error(`${target.venueName}: 失敗`, error);
    }
  }

  // 0021: 作成から24時間を過ぎた登録待ちを消す。試行の記録はレート制限に要る24時間より長めに残す。
  const now = Date.now();
  await store.deleteStaleRegistrationData(new Date(now - DAY_MS), new Date(now - 2 * DAY_MS));

  if (targets.length > 0 && failures === targets.length) {
    throw new Error("すべての会場の巡回に失敗しました");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
