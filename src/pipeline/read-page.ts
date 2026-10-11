import { createHash } from "node:crypto";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export type ReadPage = {
  /** 本文の主要部分のテキスト。LLM に渡す。 */
  mainText: string;
  /** 主要部分のハッシュ。前回と同じなら抽出をやり直さない（0010）。 */
  contentHash: string;
  /** 館が指定した画像（og:image）。保存せず直接表示する（0007）。 */
  imageUrl: string | null;
};

/** 取得したページを、決定的に読める範囲で読む。 */
export function readPage(html: string, url: string): ReadPage {
  const { document } = parseHTML(html);
  // Readability は document を書き換えるので、meta は先に読む。
  const imageUrl = ogImageOf(document as unknown as Document, url);
  const article = new Readability(document as unknown as Document).parse();
  const mainText = (article?.textContent ?? "").replace(/\s+/g, " ").trim();
  return { mainText, contentHash: sha256(mainText), imageUrl };
}

function ogImageOf(document: Document, pageUrl: string): string | null {
  const content = document.querySelector('meta[property="og:image"]')?.getAttribute("content")?.trim();
  if (!content) return null;
  try {
    return new URL(content, pageUrl).toString();
  } catch {
    return null;
  }
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
