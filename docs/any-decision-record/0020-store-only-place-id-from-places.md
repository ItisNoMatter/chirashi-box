# 0020: Google Placesからは place_id だけを保存し、会場の情報は館自身のページから取る

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
0005で会場の同一性をGoogle Placesの `place_id` で決めると決め、規約上どのデータを保存してよいかは実装前に確認するとしていた。調べた結果は次のとおり。
- `place_id` はキャッシュ制限の例外で、無期限に保存できる。
- それ以外（名前、住所、Webサイトなど）は、原則として事前取得・キャッシュ・保存が制限される。座標は最長30日の一時的なキャッシュのみ認められる。
- Places APIのデータを表示するときは、Googleの帰属表示（ロゴか「Google Maps」の文字）が必要。
- 料金は、IDだけを返すText Search（Essentials IDs Only）が無料で上限なし。名前や住所も返すText Search Proは月5,000回まで無料。

初期スキーマ（`venues`）は、会場名・住所・都道府県・市区町村・Webサイトを保存する作りで、これらをPlacesから取って保存すると規約に反する。

## Decision
- Placesから保存するのは `place_id` だけにする。同一性の解決には、無料のText Search（IDs Only）を使う。
- 会場名と住所は、抽出のときにLLMが展示ページ（館や主催者のページ）から抜き出したものを保存する。都道府県と市区町村は、その住所から導く。
- 会場の表示名は、最初に登録されたものを保ち、後から別の表記で上書きしない。巡回の対象館は、巡回設定を投入するときに開発者が正しい名前を確かめる。
- 会場の公式サイトのドメイン（0016の判定に使う）は、巡回設定の一覧ページのURLから得る。URL登録の確認画面でユーザーが会場を選んだときは、その場でPlacesから取得したWebサイトを判定にだけ使い、保存しない。
- URL登録で「この会場で合っていますか？」と確かめる画面では、Placesの名前と住所をその場で表示するだけにして保存せず、Googleの帰属表示を付ける。

## Alternatives
- Placesの情報を保存し、定期的に取り直して「一時的なキャッシュ」の範囲に収める: 会場の表記がGoogleマップに揃うが、座標以外の項目にはキャッシュしてよい期間が明示されておらず、規約上グレー。取り直すたびにPro SKUの課金が発生し、会場の数に比例して定期的なコストがかかり続ける。

## Consequences
- 0005の「座標と住所が手に入るので、『近くで』やエリアでの絞り込みに使える」は成り立たなくなる。エリアは、館のページから抜き出した住所から導く。
- 0014で保留した「近くで」は、座標を30日を超えて保存できないため、作る場合はリクエストのたびにPlacesを引くか、別の手段（館の住所のジオコーディングも同じGoogleの規約に当たる点に注意）を検討する必要がある。
- LLMが抜き出す会場名・住所の表記は揺れるが、最初の表記を保つことで、表示は安定する。

## Related
- [0005-google-places-id-as-venue-identity](./0005-google-places-id-as-venue-identity.md)
- [0014-browse-screen-scope](./0014-browse-screen-scope.md)
- [0016-enforce-data-sourcing-rules-by-mechanism](./0016-enforce-data-sourcing-rules-by-mechanism.md)
