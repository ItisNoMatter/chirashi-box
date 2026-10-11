import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { CandidateExhibition, ExtractedExhibition } from "@/domain/exhibition-matching";
import type { LocalDate } from "@/domain/period";
import type { DuplicateJudge, Link, LinkSelector } from "../crawl-ports";
import { recordUsage } from "./usage";

const MODEL = process.env.EXTRACTION_MODEL ?? "claude-opus-5-5";
const EFFORT = (process.env.EXTRACTION_EFFORT ?? "low") as "low" | "medium" | "high";

const client = new Anthropic();

async function ask<T extends z.ZodType>(schema: T, system: string, content: string): Promise<z.infer<T> | null> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: EFFORT, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content }],
  });
  recordUsage(response.usage);
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output ?? null;
}

/** 一覧ページのリンクから、個別の展示ページを選ぶ（0022）。 */
export class ClaudeLinkSelector implements LinkSelector {
  constructor(private readonly today: () => LocalDate) {}

  async select({ listingUrl, links }: { listingUrl: string; links: Link[] }): Promise<string[]> {
    if (links.length === 0) return [];
    const numbered = links.map((link, index) => `${index}\t${link.text}\t${link.url}`).join("\n");
    const output = await ask(
      z.object({ indexes: z.array(z.number().int()).describe("個別の展覧会ページのリンクの番号") }),
      `美術館の展覧会一覧ページにあるリンクから、1つの展覧会を紹介する個別ページへのリンクだけを選んでください。
ナビゲーション、アクセス、お知らせ、イベント（講演会・ワークショップ）、過去の展覧会のアーカイブ一覧、他のページ送りは選ばないでください。
会期が今日より前に終わったと、リンクの文字やURLの年・日付から明らかに分かる展覧会は選ばないでください（0026）。終わったかどうか分からないものは選んでください。`,
      `今日の日付: ${this.today()}
一覧ページ: ${listingUrl}\n\n番号\t文字\tURL\n${numbered}`,
    );
    if (!output) return [];
    return [...new Set(output.indexes)].filter((index) => index >= 0 && index < links.length).map((index) => links[index].url);
  }
}

/** 名前が一致しない重複候補を判定する（0006）。 */
export class ClaudeDuplicateJudge implements DuplicateJudge {
  async judge({ extracted, candidates }: { extracted: ExtractedExhibition; candidates: CandidateExhibition[] }) {
    const list = candidates
      .map((candidate) => `- id=${candidate.id} 「${candidate.title}」 ${candidate.startDate}〜${candidate.endDate}`)
      .join("\n");
    const output = await ask(
      z.object({
        sameAsExhibitionId: z.string().nullable().describe("同じ展覧会である候補の id。どれとも違えば null"),
        reason: z.string().describe("判定の根拠（短く）"),
      }),
      `同じ会場で会期が重なる展覧会の候補の中に、新しく見つかった展覧会と同じものがあるかを判定してください。
表記の違い（サブタイトルの有無、略称）は同じとみなし、別のテーマの展覧会（コレクション展と企画展など）は違うとみなしてください。
確信が持てなければ null にしてください（誤って統合するより、重複のほうがましです）。`,
      `新しく見つかった展覧会: 「${extracted.title}」 ${extracted.startDate}〜${extracted.endDate}\n\n候補:\n${list}`,
    );
    return output ?? { sameAsExhibitionId: null, reason: "判定できなかった" };
  }
}
