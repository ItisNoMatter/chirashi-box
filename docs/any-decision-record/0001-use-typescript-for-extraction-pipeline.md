# 0001: 展示情報の収集処理をTypeScriptで書き、Next.jsと同じリポジトリに統一する

- Date: 2026-10-10
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
展示情報の収集には「美術館公式サイトの定期巡回（GitHub Actions cron）」と「ユーザーによるURL登録」の2経路があり、どちらも同じ抽出関数（ページ取得 → LLMで展示名・会場・会期・URL等を構造化抽出）を共有する方針になっている。フロントはNext.js（TypeScript）で作る想定のため、収集処理の言語をTypeScriptに揃えるか、開発者の得意分野であるKotlin + Jevで書くかが未決だった。

## Decision
収集処理（抽出関数・巡回スクリプト）はTypeScriptで書き、Next.jsと同じリポジトリ・同じツールチェーンで管理する。LLM出力の型安全性はZod等のスキーマ検証で担保する。

## Alternatives
- 収集をKotlin + Jevで書き、フロントのみTypeScript: URL登録はユーザー操作をきっかけにその場で動くため、Next.jsのAPIルートから抽出関数を呼ぶ必要がある。Kotlinにすると、そのためだけにKotlinのサーバーを追加する（常時動かすサーバーがない構成の利点が崩れる）か、TypeScriptで同じ処理を二重実装することになる。DBスキーマの型も2言語で二重管理になる。

## Consequences
- 抽出関数を1モジュールとして、APIルート（URL登録）と巡回スクリプトの両方からimportできる。
- Supabaseの生成型をフロントと収集で共有できる。
- Kotlin/Jevの得意分野は活かせない。Jevを使いたくなった場合は、巡回側だけを後で切り出す余地を残す。
