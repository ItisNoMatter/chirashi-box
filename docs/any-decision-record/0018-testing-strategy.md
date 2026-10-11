# 0018: 判定ロジックはテストファーストで書き、LLMは境界の向こうに置き、抽出の品質は別の評価スクリプトで測る

- Date: 2026-10-11
- Status: Accepted
- Category: process
- Deciders: the user, Claude Code

## Context
ここまでの決定で、ロジックの大半は判定になった。重複の照合（0003、0006）、会場の同一性（0005）、会期の状態と並び順（0014、0015）、ページの出どころの判定（0016）。誤った統合のような誤りは静かに起きるため、判定のロジックが一番壊れやすく、一番大事な部分になる。

## Decision
- 照合・正規化・会期の状態・並び順・出どころ判定の経路分けは、純粋な関数として切り出し、Vitestを使ってテストファーストで書く。
- LLMとGoogle Places APIはインターフェースの向こうに置き、テストでは偽物に差し替える。CIではLLMの費用をかけない。
- 抽出の正しさ（0012）は、CIとは別の評価スクリプトで、実際のAPIを叩いて測る。費用がかかるので手動で実行する。
- 評価に使う館のページのHTMLは、館の著作物を含むので、リポジトリには入れず（`.gitignore`）、手元か非公開のストレージに置く。
- RLSのポリシーは、他人の「気になる」が見えるといった重大な問題につながるので、Supabaseのローカル環境に対するテストで早めに確認する。
- E2Eテストは、核の流れ（眺める → 気になる → マイページ）の画面ができた時点で1本だけ足す。

## Alternatives
- 最初から核の流れをPlaywrightのE2Eテストで確認する: 認証の状態とRLSを含めた実際の流れを確認できるが、テスト用のSupabase環境の準備が必要で、画面がまだ固まっていない段階では立ち上がりが遅くなるコストに見合わない。

## Consequences
- 画面を通した一連の流れは、E2Eテストを足すまでは自動では確認されない。
- 評価用のページと正解の組を、手元で管理する必要がある。

## Related
- [0003-staged-exhibition-deduplication](./0003-staged-exhibition-deduplication.md)
- [0006-route-specific-duplicate-resolution](./0006-route-specific-duplicate-resolution.md)
- [0012-llm-model-for-extraction](./0012-llm-model-for-extraction.md)
- [0016-enforce-data-sourcing-rules-by-mechanism](./0016-enforce-data-sourcing-rules-by-mechanism.md)
