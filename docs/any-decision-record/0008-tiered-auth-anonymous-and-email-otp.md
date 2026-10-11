# 0008: 認証を段階的にする（閲覧はログイン不要、気になるは匿名可、URL登録はメール紐づけ済みのみ）

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
前の会話では「Supabaseの匿名サインインで始め、後からメールを紐づける」案だった。しかし、URL登録は1回ごとにLLMの呼び出しとGoogle Places APIの検索（0005）が発生する、お金のかかる操作であり、誰でも匿名で使えると、悪用されたときに請求が膨らむ。iPhoneのホーム画面に追加したPWAでは、メールのマジックリンクがSafari側で開いてしまいログインが反映されないため、メールでのログインは6桁のコードを入力するOTPにする前提がある。

## Decision
- 展示の閲覧：ログイン不要。
- 気になる：Supabaseの匿名サインインで使える。
- URL登録：メールOTPでメールアドレスを紐づけたアカウントに限る。アカウント単位でレート制限をかける。
- ログイン方法はメールOTPだけにする。Apple/GoogleのOAuthは、iOSのPWAでの挙動を検証してから追加を検討する。

## Alternatives
- 匿名サインインで始め、後からメールを紐づける（すべての操作を匿名で可能にする）: お金のかかるURL登録を使い捨ての匿名ユーザーが叩ける。CAPTCHAやレート制限も、匿名ユーザーを作り直せば回避できるので、利用者が増えたときに守りきれない（0004）。
- 最初からメールOTPでログインさせる: 単純で引き継ぎもできるが、チラシを眺めたいだけの人にも、核の体験の入り口で手間をかけさせる。

## Consequences
- 匿名とメール紐づけ済みの2つの状態を、UIとRLSで扱い分ける必要がある。
- 匿名ユーザーの作成にはCAPTCHA（Turnstileなど）を付け、使われなくなった匿名ユーザーを掃除する仕組みが必要。
- URL登録をしたくなった時点でメールを紐づけてもらうので、機種変更時の記録の引き継ぎも自然に促せる。

## Related
- [0004-no-mvp-only-non-scaling-design](./0004-no-mvp-only-non-scaling-design.md)
- [0005-google-places-id-as-venue-identity](./0005-google-places-id-as-venue-identity.md)
