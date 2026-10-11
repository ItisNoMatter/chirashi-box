import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** ブラウザ用。匿名サインイン（0019）に使う。 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
