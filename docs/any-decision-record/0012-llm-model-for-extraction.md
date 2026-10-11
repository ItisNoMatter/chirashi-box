# 0012: 抽出にはClaude Opus 5.5（effort low）を使い、巡回はBatch APIに流す

- Date: 2026-10-11
- Status: Accepted
- Category: tooling
- Deciders: the user, Claude Code

## Context
展示ページからの構造化抽出（展示名・会場名・住所・会期・画像URL）と、巡回での重複判定（0006）にLLMを使う。抽出の型は、どのモデルでもstructured outputs（`client.messages.parse` + Zodスキーマ）で担保できる。0010の差分処理により、LLMに通るのは1日あたり新しい展示と変わった展示の分だけになる。

## Decision
- モデルはClaude Opus 5.5（`claude-opus-5-5`）を、effortを`low`にして使う。
- モデルIDとeffortは設定で切り替えられるようにする。最初に巡回する館の実際のページ十数件で抽出結果の正しさを測ってから、より安いモデルに下げるかを判断する。
- 巡回（日次・急がない処理）はMessage Batches API（料金が50%引き、結果は非同期）に流す。URL登録（ユーザーがその場で待つ処理）は通常のAPIで呼ぶ。

## Alternatives
- Claude Sonnet 5.5（$2 / $10 per MTok）: Opusの約半額だが、難しいページ（会期の曖昧な表記、1ページに複数の展示）での精度の差は測ってみないと分からない。測定の結果次第で切り替える候補として残す。
- Claude Haiku 4.5（$1 / $5 per MTok）: 一番安く速いが1世代前のモデルで、0006の重複判定のような判断を伴う処理には不安が残る。

## Consequences
- 1ページあたりの費用は3案の中で一番高い（粗い見積もりで1ページ数円程度。実測が必要）が、コストは新しく出た展示の数にしか比例しない（0010）。
- 巡回の処理は、Batchの投入 → 結果の回収という非同期の流れになる。0011のGitHub Actionsのジョブ内で完了を待つか、投入と回収を分けるかは、実装時に決める。
- 抽出の正しさを測る小さな評価セット（実ページと正解の組）が必要になる。

## Related
- [0001-use-typescript-for-extraction-pipeline](./0001-use-typescript-for-extraction-pipeline.md)
- [0006-route-specific-duplicate-resolution](./0006-route-specific-duplicate-resolution.md)
- [0010-diff-based-crawl-extraction](./0010-diff-based-crawl-extraction.md)
- [0011-run-crawl-on-github-actions](./0011-run-crawl-on-github-actions.md)
