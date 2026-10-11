# 0023: 巡回も通常のAPIで同期的に呼び、Batch APIは後から足せる最適化として残す

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
0012で、巡回はBatch API（料金が半額、結果は非同期）に流すと決めた。巡回を具体的に組み立てると、LLMの処理が3段階、順番に並ぶ（一覧のリンクから個別ページを選ぶ（0022）→ 個別ページから抽出する → 名前が一致しない重複候補を判定する（0006））。Batchの結果は通常1時間以内だが最長24時間かかり、Batch APIでは拒否されたときの代替（`fallbacks`）が使えない。

## Decision
巡回も、URL登録と同じく通常のAPIで同期的に呼ぶ。0012のうち「巡回はBatch APIに流す」の部分を見直す。Batch APIは、費用が実際に問題になったときに、抽出の段階だけを切り替える最適化として残す。

## Alternatives
- 同じジョブの中で各段階のBatchの完了を待ち、時間切れなら次回に再開する: 料金は半額だが、3段階それぞれで投入・完了待ち・回収を繰り返し、時間切れに備えて投入したBatchのidを保存して再開する仕組みが要り、巡回のコードが一番複雑になる。
- 毎日の実行で「前回のBatchの回収」と「次の段階の投入」を交互に行う: 待ち時間はジョブに乗らないが、1段階に1日かかり、新しい展示が一覧に出るまで3日かかる。段階ごとの状態をDBで管理する必要もある。

## Consequences
- 巡回とURL登録が、同じ抽出関数をそのまま使える（0001）。拒否されたときの代替も使える。
- 新しい展示が、その日のうちに一覧に出る。
- 巡回の分のLLMの費用は、Batchを使う場合の2倍になる。0010の差分処理により、費用は新しく出た展示や変わった展示の数に比例するだけで、MVPの規模では月に数百円程度の差の見込み（実測が必要）。

## Related
- [0001-use-typescript-for-extraction-pipeline](./0001-use-typescript-for-extraction-pipeline.md)
- [0006-route-specific-duplicate-resolution](./0006-route-specific-duplicate-resolution.md)
- [0010-diff-based-crawl-extraction](./0010-diff-based-crawl-extraction.md)
- [0012-llm-model-for-extraction](./0012-llm-model-for-extraction.md)
- [0022-discover-exhibition-links-with-llm](./0022-discover-exhibition-links-with-llm.md)
