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
  const mainText = (mainElementText(document as unknown as Document) ?? readabilityText(document as unknown as Document))
    .replace(/\s+/g, " ")
    .trim();
  return { mainText, contentHash: sha256(mainText), imageUrl };
}

/**
 * サイトが <main> で本文を示していれば、それに従う（0026）。
 * Readability は解説文だけを選んで展示名・会期を落としたり、クッキーの案内を本文と取り違えたりすることがある。
 * <main> 内の見出し（header）には展示名が入ることが多いので、外すのはナビゲーションだけにする。
 */
function mainElementText(document: Document): string | null {
  const main = document.querySelector("main");
  if (!main) return null;
  for (const element of main.querySelectorAll("script, style, noscript, template, nav")) element.remove();
  return main.textContent;
}

function readabilityText(document: Document): string {
  return new Readability(document).parse()?.textContent ?? "";
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

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
