# 0028: 規約を確認していないサイトの画像は、確認が済むまで表示しない

- Date: 2026-10-12
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
URL 登録（0005）では、利用者が貼った URL のページを取得して展示を登録する。巡回対象と違い、規約を人が確認していないサイトのページも入ってくる。今までの守りは次のとおりだった。
- robots.txt に従う。
- まとめサイトなどを拒否する（0016）。
- 事実の情報だけを保存する。
- 確認済みのドメインには、そのドメインの制限をかける（0025）。

一方、誰も規約を確認していないドメインでは、公式ページへのリンクも、館の画像の直接表示も、そのまま出ていた。中でも危ないのは画像で、著作物を保存はしないもののアプリの中で見せており、許されるかどうかがはっきりしない。

## Decision
- `site_policies` に行があるドメインを「規約を確認済み」とみなす。
- 行がないドメインは、リンクは出す。画像は出さず、自動で作ったチラシにする。
- 画像が CDN など別のドメインにあるときは、出どころのページのドメインで判断する（0025 と同じ）。
- 規約を確認して制限のなかった館（東京都美術館、国立新美術館、アーティゾン美術館、東京都現代美術館）にも、`allow_links = true, allow_images = true` の行を入れる。

## Alternatives
- 今のまま、苦情が来たら外す: 何も作らずに済み、登録した展示にもすぐ画像が出る。ただし、画像を出してほしくないサイトの画像を、知らないまま出し続ける可能性がある。アプリには苦情を受け付ける連絡先もない。

## Consequences
- URL 登録で入った新しいドメインの展示は、規約を確認して `site_policies` に行を入れるまで、仮のチラシになる。確認はユーザーの手作業になる。
- 確認が必要なドメインを見つけやすくする仕組み（確認待ちの一覧など）は、まだない。登録が増えたら考える。
- リンクは、規約を確認していなくても出し続ける。リンクを張ること自体は問題になりにくく、苦情があれば `allow_links = false` で外せる。

## Related
- [0007-hotlink-official-images-with-generated-fallback](./0007-hotlink-official-images-with-generated-fallback.md)
- [0016-enforce-data-sourcing-rules-by-mechanism](./0016-enforce-data-sourcing-rules-by-mechanism.md)
- [0025-respect-per-site-link-and-image-rules](./0025-respect-per-site-link-and-image-rules.md)
