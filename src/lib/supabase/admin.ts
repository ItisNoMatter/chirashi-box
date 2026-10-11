import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * サーバー専用。RLS を越えて書き込む（巡回と URL 登録の確定）。
 * 呼び出す前に、操作する利用者の本人確認と認可を必ず済ませること。
 */
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
