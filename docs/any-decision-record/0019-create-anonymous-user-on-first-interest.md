# 0019: 匿名ユーザーは、初めて「気になる」を押した時点で作る

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
0008で、閲覧はログイン不要、「気になる」は匿名サインインで使えるようにし、匿名ユーザーの作成にはCAPTCHAを付け、使われなくなった匿名ユーザーは掃除すると決めた。核の画面を実装するにあたり、匿名ユーザーをいつ作るかを決める必要があった。

## Decision
初めて「気になる」を押した時点で、ブラウザ側で `signInAnonymously()`（CAPTCHAのトークン付き）を呼んで匿名ユーザーを作り、その後に「気になる」を付ける。CAPTCHA（Turnstile）は本番環境で有効にし、ローカルでは無効のまま、差し込む場所だけを用意しておく。

## Alternatives
- アプリを開いた時点で、`proxy.ts` が匿名セッションを作る: どのページでも必ずユーザーがいる前提で書けて単純だが、眺めるだけの訪問者やクローラーのアクセスのたびに匿名ユーザーが作られ、`auth.users` と掃除の負担が利用者の数ではなく訪問の数に比例して増える（0004に反する）。CAPTCHAも、ページを開く時点で挟むことになる。

## Consequences
- 作られるユーザーは、実際に「気になる」を使った人だけになる。
- 「気になる」ボタンに、ユーザーがまだいない場合の分岐が要る。
- マイページには、ユーザーがいない場合の空の状態が要る。

## Related
- [0004-no-mvp-only-non-scaling-design](./0004-no-mvp-only-non-scaling-design.md)
- [0008-tiered-auth-anonymous-and-email-otp](./0008-tiered-auth-anonymous-and-email-otp.md)
