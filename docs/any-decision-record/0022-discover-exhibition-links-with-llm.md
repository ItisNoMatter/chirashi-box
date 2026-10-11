# 0022: 一覧ページから個別の展示ページを見つけるのはLLMに任せ、館ごとのURLパターンで上書きできるようにする

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
巡回は「会場の一覧ページ → 個別の展示ページ → 抽出」という流れで（0010）、一覧ページから個別ページのURLをどう集めるかが決まっていなかった。館ごとに一覧ページの作りはバラバラ。

## Decision
- 基本は、一覧ページの同じサイト内のリンク（文字とURLの組）だけをLLMに渡し、個別の展示ページを選ばせる。HTML全体は渡さない。
- 巡回設定（`crawl_targets`）に個別ページのURLパターン（正規表現）がある館は、LLMを使わずパターンで決定的に選ぶ。
- MVPでは、LLMで選ぶ経路だけを実装し、パターン用の列だけを先に用意しておく。パターンでの上書きは、LLMの判定で問題が出た館が現れてから実装する。

## Alternatives
- 館ごとに個別ページのURLパターンを巡回設定に書く（パターンだけにする）: 決定的で追加費用もないが、巡回対象を加えるたびに開発者がサイトを見てパターンを書く必要があり（0004）、サイトが改装されると黙って拾えなくなり、気づく仕組みもない。
- LLMで選ぶ経路だけにする: 手間はないが、判定が不安定な館を決定的に直す手段がない。

## Consequences
- 巡回設定は一覧ページのURLだけで済むので、0009の巡回対象の自動発見とも相性が良い。
- LLMに通るのは一覧ページのハッシュが変わった日だけで（0010）、渡すのもリンクの一覧だけなので、費用は小さい。
- LLMが関係ないページを選んでも、次の抽出で「展示ページではない」と判定されて落ちるが、その分の抽出の費用はかかる。

## Related
- [0004-no-mvp-only-non-scaling-design](./0004-no-mvp-only-non-scaling-design.md)
- [0009-crawl-targets-in-database](./0009-crawl-targets-in-database.md)
- [0010-diff-based-crawl-extraction](./0010-diff-based-crawl-extraction.md)
