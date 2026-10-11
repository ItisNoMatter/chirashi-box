import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import robotsParser from "robots-parser";
import type { FetchResult, PageFetcher } from "../ports";

/** アプリ名と連絡先を名乗る（0016）。 */
const USER_AGENT = `chirashi-box/0.1 (+${process.env.CRAWLER_CONTACT ?? "contact-not-set"})`;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;
/** 館のサーバーに配慮し、同じホストへのリクエストの間隔をあける（0011）。 */
const MIN_INTERVAL_PER_HOST_MS = Number(process.env.CRAWL_INTERVAL_MS ?? 2_000);
const lastRequestAt = new Map<string, number>();

/**
 * robots.txt を確かめてからページを取得する。
 * URL 登録では利用者が渡した URL をサーバーから取りに行くので、内部のアドレスには接続しない（SSRF 対策）。
 */
export class HttpPageFetcher implements PageFetcher {
  async fetch(url: string): Promise<FetchResult> {
    let current = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isPublicHttpUrl(current))) return { kind: "failed" };
      if (!(await robotsAllows(current))) return { kind: "robots_disallowed" };

      const response = await request(current);
      if (!response) return { kind: "failed" };

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { kind: "failed" };
        current = new URL(location, current).toString();
        continue;
      }
      if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return { kind: "failed" };

      const html = await readLimited(response);
      return html === null ? { kind: "failed" } : { kind: "ok", html, finalUrl: current };
    }
    return { kind: "failed" };
  }
}

async function request(url: string): Promise<Response | null> {
  await waitForTurn(new URL(url).host);
  try {
    return await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

async function waitForTurn(host: string) {
  const wait = (lastRequestAt.get(host) ?? 0) + MIN_INTERVAL_PER_HOST_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt.set(host, Date.now());
}

async function readLimited(response: Response): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  return decode(bytes, response.headers.get("content-type"));
}

/** Shift_JIS などの古い文字コードのページもあるので、宣言された文字コードで読む。 */
function decode(bytes: Buffer, contentType: string | null): string {
  const declared =
    contentType?.match(/charset=["']?([\w-]+)/i)?.[1] ??
    bytes.subarray(0, 4096).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  try {
    return new TextDecoder(declared ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

const robotsCache = new Map<string, ReturnType<typeof robotsParser> | "disallow_all" | "allow_all">();

async function robotsAllows(url: string): Promise<boolean> {
  const origin = new URL(url).origin;
  let robots = robotsCache.get(origin);
  if (!robots) {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await request(robotsUrl);
    if (!response || response.status >= 500) {
      // RFC 9309: robots.txt に到達できない（5xx）ときは、全体が禁止されているとみなす。
      robots = "disallow_all";
    } else if (!response.ok) {
      // 4xx（robots.txt がない）は、制限なしとみなす。
      robots = "allow_all";
    } else {
      robots = robotsParser(robotsUrl, (await readLimited(response)) ?? "");
    }
    robotsCache.set(origin, robots);
  }
  if (robots === "disallow_all") return false;
  if (robots === "allow_all") return true;
  return robots.isAllowed(url, USER_AGENT) !== false;
}

async function isPublicHttpUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : await resolveAll(host);
  return addresses.length > 0 && addresses.every(isPublicAddress);
}

async function resolveAll(host: string): Promise<string[]> {
  try {
    return (await lookup(host, { all: true })).map((entry) => entry.address);
  } catch {
    return [];
  }
}

function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = address.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPublicAddress(v6.slice(7));
  return !(v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80"));
}
