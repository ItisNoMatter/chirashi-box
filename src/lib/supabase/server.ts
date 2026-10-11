import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";

/** Server Component / Server Action 用。閲覧者本人のセッション（cookie）で動き、RLS が効く。 */
export async function createClient() {
  // セッションの有効期限の確認で現在時刻を読むので、プリレンダーではなくリクエスト時に動かす。
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component からは cookie を書けない。セッションの更新は proxy.ts が担う。
          }
        },
      },
    },
  );
}
