import "server-only";
import { connection } from "next/server";
import type { LocalDate } from "@/domain/period";

/**
 * 日本時間での今日の日付。会期の状態はこの日付で判定する。
 * Cache Components では現在時刻をプリレンダーに焼き込まないよう、リクエスト時に評価する。
 */
export async function todayInTokyo(): Promise<LocalDate> {
  await connection();
  // en-CA は YYYY-MM-DD 形式で出力される。
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}
