# 0027: クラウドからのアクセスを断るサイトは、回り道をせず巡回を止め、許可を申し込む

- Date: 2026-10-12
- Status: Accepted
- Category: process
- Deciders: the user, Claude Code

## Context
東京都現代美術館の一覧（JSON）が、手元のパソコンからは取れるのに、GitHub Actions からは毎回 HTTP 403 を返された。取得に失敗した理由をログに出すようにして、初めて分かった。クラウドのサーバー（データセンターの IP アドレス）からのアクセスを、まとめて断っているとみられる。robots.txt はなく、利用規約にも自動での収集を禁じる条項はない。URL 登録も Vercel というクラウドのサーバーで動くので、同じように断られる可能性が高い。

## Decision
- 東京都現代美術館の巡回対象を無効にする（`enabled = false`）。
- 三菱一号館美術館・森美術館へのリンクの許可の申し込みに、東京都現代美術館も加える。「クラウドのサーバーからの巡回を許可してもらえるか」を尋ねる。申し込みの文面は Claude Code が下書きし、送るのはユーザー（0025）。
- 今後も、サイトが技術的にアクセスを断っている場合は、IP アドレスや名乗り（User-Agent）を変えるなどの回り道をしない。

## Alternatives
- 東京都現代美術館だけ、ユーザーのパソコンから巡回する: すぐに展示を出せる。ただし、館がはっきり断っているアクセスをすり抜けることになり、サイトごとの決まりを尊重する方針（0016、0025）に反する。毎晩パソコンを動かす必要もあり、常に動かすサーバーを持たない構成（0011）の利点がなくなる。

## Consequences
- 許可が出るまで、東京都現代美術館の展示はアプリに出ない。許可が出たら、巡回対象を有効に戻すだけで再開できる。
- 403 の原因は推測で、館が意図して私たちを断っているのかは分からない。返事が来ない場合は、出ないままになる。
- 取得の失敗の理由（HTTP の状態、時間切れなど）をログに残すようにした。ほかの館で同じことが起きても、原因を追える。

## Related
- [0016-enforce-data-sourcing-rules-by-mechanism](./0016-enforce-data-sourcing-rules-by-mechanism.md)
- [0025-respect-per-site-link-and-image-rules](./0025-respect-per-site-link-and-image-rules.md)
- [0026-adapt-crawl-to-real-museum-sites](./0026-adapt-crawl-to-real-museum-sites.md)
