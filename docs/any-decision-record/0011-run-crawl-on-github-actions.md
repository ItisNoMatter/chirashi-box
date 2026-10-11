# 0011: 巡回はGitHub Actionsのcronで実行し、処理の単位を「会場1つ」にする

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
巡回は、館のサーバーに配慮して1館ずつ間隔をあけて取得するため、会場が増えるほど1回の実行にかかる時間が延びる。実行環境として、GitHub Actionsのcron、Vercel Cron／SupabaseのEdge Functions + pg_cron、DB上のキューとワーカーの3つを比較した。

## Decision
巡回はGitHub Actionsのcronで日次に実行し、1つのジョブで全会場を順に回る。巡回スクリプトは「会場1つを処理する関数」と、それを順に呼ぶループに分けておく。

## Alternatives
- Vercel Cron、またはSupabaseのEdge Functions + pg_cronで実行する: サーバーレス関数は1回の実行時間が短いため、ゆっくり全館を回ると時間切れになる。それを避けるには、結局キューの仕組みが必要になる。
- DBに巡回待ちのキューを持ち、ワーカーが取り出して処理する: 規模が大きくなっても並列化でき、実行環境も乗り換えられる正しい形だが、今の規模ではキューの管理（取り出し中のロック、失敗時の再試行）が過剰。

## Consequences
- 1つのジョブを数時間まで動かせるので、ゆっくり取得しても時間切れになりにくい。実行ログが残り、手動での再実行も簡単。
- privateリポジトリでは、無料で使える実行時間に月ごとの上限がある。差分だけを処理するので（0010）当面は収まる見込みだが、上限の値は要確認。
- cronの起動は混雑時に遅れることがあるが、日次の巡回なら問題ない。
- 規模が大きくなったら、GitHub Actionsのmatrixで会場を分割して並列に走らせるか、キューに移す。「会場1つを処理する関数」はそのまま使えるので、作り直しにはならない（0004）。

## Related
- [0001-use-typescript-for-extraction-pipeline](./0001-use-typescript-for-extraction-pipeline.md)
- [0004-no-mvp-only-non-scaling-design](./0004-no-mvp-only-non-scaling-design.md)
- [0010-diff-based-crawl-extraction](./0010-diff-based-crawl-extraction.md)
