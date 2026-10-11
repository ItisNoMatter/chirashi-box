import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { createClient } from "@/lib/supabase/server";
import { EmailLinkForm } from "./EmailLinkForm";
import { RegisterFlow } from "./RegisterFlow";

/** 展示の URL 登録。メールを紐づけたアカウントだけが使える（0008）。 */
export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-bold">展示を登録する</h1>
      <Suspense fallback={<Loading />}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}

async function RegisterContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const hasEmail = Boolean(data?.claims.email) && data?.claims.is_anonymous !== true;
  return hasEmail ? <RegisterFlow /> : <EmailLinkForm />;
}
