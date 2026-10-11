# 0021: URL登録の確認待ちの間、抽出結果は「登録待ち」テーブルに保存する

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
URL登録は「URLを貼る → 抽出（LLM）→ 会場の確認（0005、0020）→ 重複候補の確認（0006）→ 登録」と、途中でユーザーに確認を求めることがあり、1回のリクエストでは終わらない。確認を待つ間、抽出結果をどこかに持っておく必要がある。

## Decision
抽出結果を `pending_registrations`（登録者、URL、抽出結果、出どころの判定、作成日時）に保存し、本人だけが読めるRLSをかける。確認の操作では、登録待ちのidと選択（会場のplace_id、重複候補のどれと同じか）だけを受け取る。作成から24時間を過ぎた登録待ちは、日次の巡回ジョブ（0011）で消す。

## Alternatives
- 確認のたびに最初から抽出し直す: 状態を持たず単純だが、確認をはさむたびにLLMとページの取得が繰り返されて費用が増え、LLMの出力が確率的なため2回目で結果が変わりうる。
- 抽出結果をクライアントに返し、確認のときに送り返してもらう: サーバーは状態を持たずに済むが、クライアントから来た抽出結果は信用できず、展示名や会期を書き換えたデータを登録でき、0016の出どころの判定も素通りされる。署名で改ざんを防ぐと、仕組みの複雑さが結局このテーブルと同程度になる。

## Consequences
- 抽出は1回だけで済み、結果は改ざんできない。
- 途中でアプリを閉じても、登録待ちから再開できる。
- テーブルが1つ増え、古い登録待ちの掃除が日次のジョブに加わる。

## Related
- [0006-route-specific-duplicate-resolution](./0006-route-specific-duplicate-resolution.md)
- [0011-run-crawl-on-github-actions](./0011-run-crawl-on-github-actions.md)
- [0016-enforce-data-sourcing-rules-by-mechanism](./0016-enforce-data-sourcing-rules-by-mechanism.md)
- [0020-store-only-place-id-from-places](./0020-store-only-place-id-from-places.md)
