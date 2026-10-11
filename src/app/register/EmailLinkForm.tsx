"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * URL 登録の前に、メールアドレスを紐づける（0008）。
 * ホーム画面に追加した PWA ではマジックリンクが Safari 側で開いてしまうので、6桁のコードを入力してもらう。
 * 匿名ユーザーなら同じアカウントにメールを足すので、それまでの「気になる」も引き継がれる。
 */
export function EmailLinkForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentAs, setSentAs] = useState<"email" | "email_change" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();

    if (data.user?.is_anonymous) {
      const { error } = await supabase.auth.updateUser({ email });
      if (!error) {
        setSentAs("email_change");
      } else if (error.code === "email_exists") {
        setMessage("このメールアドレスは別のアカウントで使われています。そのアカウントでログインすると、この端末の「気になる」は引き継がれません。");
        const { error: signInError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (!signInError) setSentAs("email");
      } else {
        setMessage("コードを送れませんでした。時間をおいて試してください。");
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) setMessage("コードを送れませんでした。時間をおいて試してください。");
      else setSentAs("email");
    }
    setBusy(false);
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!sentAs) return;
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: sentAs });
    setBusy(false);
    if (error) {
      setMessage("コードが正しくないか、期限が切れています。");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed">
        展示を登録するには、メールアドレスの確認が必要です。機種変更のときにも、記録を引き継げるようになります。
      </p>
      {sentAs === null ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button disabled={busy} className="rounded-full bg-foreground py-2 text-sm text-background disabled:opacity-50">
            確認コードを送る
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <p className="text-sm">{email} に届いた6桁のコードを入力してください。</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]{6}"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button disabled={busy} className="rounded-full bg-foreground py-2 text-sm text-background disabled:opacity-50">
            確認する
          </button>
        </form>
      )}
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
