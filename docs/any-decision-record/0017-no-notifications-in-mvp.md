# 0017: 通知はMVPに入れず、ういぴさんの回答を待って判断する

- Date: 2026-10-11
- Status: Accepted
- Category: rejected
- Deciders: the user, Claude Code

## Context
「気になる」を付けた展示の会期が終わりそうなときの通知について、要否をういぴさんにDMで確認する予定になっていたが、まだ回答がない。

## Decision
通知はMVPに入れない。ういぴさんの回答が「欲しい」だった場合は、MVPの次の最初の追加機能として扱う。

## Alternatives
- MVPに通知を入れる: iOSのPWAでのプッシュ通知はホーム画面に追加した後でしか使えず、Service Worker（Serwistなど、0013）の準備も要るため、MVPの範囲を大きく広げてしまう。要否もまだ分からない。

## Consequences
- マイページの「開催中」を終わるのが近い順に並べ、「あと◯日」の札を付けることで（0014、0015）、アプリを開いたときには同じ情報が目に入るようにしておく。

## Related
- [0013-pwa-with-nextjs-on-vercel](./0013-pwa-with-nextjs-on-vercel.md)
- [0014-browse-screen-scope](./0014-browse-screen-scope.md)
- [0015-my-page-structure-and-visibility](./0015-my-page-structure-and-visibility.md)
