# 0029: 複数の展示で同じ画像は、展示のチラシとして表示しない

- Date: 2026-10-12
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
館の画像は、各展示ページが指定する代表画像（og:image）を使っている（0007）。ところが、本番でアーティゾン美術館の展示を見ると、どの展示にも「ARTIZON MUSEUM」のロゴが出ていた。ほかの館のデータも調べると、次のことが分かった。
- アーティゾン美術館：7件すべてが同じロゴ画像（`sns_logo.jpg`）。
- 東京都現代美術館：11件中9件が、サイト共通の画像（`og-image@2x.png`）。
- 東京都美術館：「ハマー美術館展」のページに、デュフィ展のポスターが指定されていた。
- 三菱一号館美術館：サイト共通の画像（`mimt_OGP.png`）。

## Decision
- 複数の展示で同じになっている画像は、表示のときに展示のチラシとして出さず、自動で作ったチラシにする。
- 判定はデータベースのビュー `shared_image_urls` で行う。`image_url` が2件以上の展示で同じなら、その画像は出さない。
- 保存しているデータは変えない。表示のときに当てはめる（0025 と同じ考え方）。

## Alternatives
- ページの中の画像から、チラシらしいものを Claude に選ばせる: 代表画像に指定されていない、展示ごとの画像を見つけられるかもしれない。ただし、LLM に渡す情報が増えて料金が上がる。また、出品作品の1枚や館の写真など、違う画像を選ぶおそれがあり、正しいかを確かめにくい。

## Consequences
- 間違った画像を出すより出さないほうがよい、という考えに立っている。正しい画像が一緒に隠れても、自動で作ったチラシになるだけで、表示は壊れない（デュフィ展の正しいポスターも隠れる）。
- そのサイトの展示が1件しかないうちは、共通の画像だと見分けられない。2件目が入った時点で見分けられる。
- 展示ごとの画像を代表画像に指定していない館（アーティゾン美術館、東京都現代美術館）は、自動で作ったチラシになる。

## Related
- [0007-hotlink-official-images-with-generated-fallback](./0007-hotlink-official-images-with-generated-fallback.md)
- [0025-respect-per-site-link-and-image-rules](./0025-respect-per-site-link-and-image-rules.md)
- [0028-hide-images-from-unreviewed-sites](./0028-hide-images-from-unreviewed-sites.md)
