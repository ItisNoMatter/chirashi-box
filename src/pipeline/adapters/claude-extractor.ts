import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { LocalDate } from "@/domain/period";
import type { ExhibitionExtractor, Extraction } from "../ports";

/** 抽出のモデルと effort は設定で切り替えられるようにする（0012）。 */
const MODEL = process.env.EXTRACTION_MODEL ?? "claude-opus-5-5";
const EFFORT = (process.env.EXTRACTION_EFFORT ?? "low") as "low" | "medium" | "high";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// 解説文を入れる項目はあえて作らない（0016）。
const ExtractionSchema = z.object({
  isExhibitionPage: z.boolean().describe("このページが、特定の1つの展覧会を紹介するページかどうか"),
  title: z.string().nullable().describe("展覧会名。サブタイトルがあれば含める"),
  startDate: z.string().nullable().describe("会期の開始日（YYYY-MM-DD）"),
  endDate: z.string().nullable().describe("会期の終了日（YYYY-MM-DD）"),
  venueName: z.string().nullable().describe("会場名（美術館・ギャラリー名）。展示室名は含めない"),
  venueAddress: z.string().nullable().describe("会場の住所。ページに書かれていなければ null"),
  publisher: z
    .enum(["venue", "organizer", "third_party"])
    .describe("このページを出したのは誰か。venue=会場自身、organizer=主催者（共催の新聞社・テレビ局の特設サイトなど）、third_party=それ以外（まとめサイト、個人のブログなど）"),
});

const SYSTEM = `あなたは美術展の公式ページから、事実の情報だけを抜き出す係です。
- 展覧会名・会期・会場名・会場の住所・ページの発行者だけを、ページに書かれているとおりに抜き出してください。
- 解説文や感想は出力しないでください。
- 会期の年が省略されている場合は、今日の日付から最も自然な年を補ってください。
- 1ページに複数の展覧会が並んでいる一覧ページや、展覧会以外のページなら isExhibitionPage を false にしてください。`;

export class ClaudeExhibitionExtractor implements ExhibitionExtractor {
  private readonly client = new Anthropic();

  constructor(private readonly today: () => LocalDate) {}

  async extract({ url, mainText }: { url: string; mainText: string }): Promise<Extraction> {
    const response = await this.client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: EFFORT, format: betaZodOutputFormat(ExtractionSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `今日の日付: ${this.today()}\nページのURL: ${url}\n\n<page>\n${mainText}\n</page>`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) return { isExhibitionPage: false };
    return toExtraction(response.parsed_output);
  }
}

function toExtraction(output: z.infer<typeof ExtractionSchema>): Extraction {
  const { isExhibitionPage, title, startDate, endDate, venueName } = output;
  if (
    !isExhibitionPage ||
    !title ||
    !venueName ||
    !startDate ||
    !endDate ||
    !DATE.test(startDate) ||
    !DATE.test(endDate) ||
    startDate > endDate
  ) {
    return { isExhibitionPage: false };
  }
  return {
    isExhibitionPage: true,
    title,
    startDate,
    endDate,
    venueName,
    venueAddress: output.venueAddress,
    publisher: output.publisher,
  };
}
