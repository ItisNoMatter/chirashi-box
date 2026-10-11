# 0015: マイページは会期の状態で3つに区切り、MVPでは本人だけが見られるものにする

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
マイページは、ういぴさんが「メインに来る画面」として挙げた、このアプリの核の部分（Filmarksのマイページに相当）。前の会話では「会期が終わりそうなものを上に出し、終わったものは『終了』に分ける」までが決まっていた。Filmarksのマイページは他の人にも見えるプロフィールで、Fan数（フォロー）も表示されている。

## Decision
- 「気になる」を付けた展示を、「開催中」（終わるのが近い順）→「もうすぐ」（始まるのが近い順）→「終了」（終わったのが新しい順）の3つに区切って表示する。
- どの区切りもチラシの3列グリッドで、見出しに件数を出す。
- 「気になる」は、終了した展示も含めていつでも外せる。
- MVPでは、マイページは本人だけが見られる。ただし、URLはユーザーごとの形（`/users/[id]`）にしておき、後から公開設定を足せるようにする。

## Alternatives
- マイページを他の人にも公開する（Filmarksと同じ）: 公開はフォロー（Fan相当）と一緒に考えるべき機能で、フォローはMVPから外している。匿名ユーザー（0008）のマイページを公開すると、プロフィール名やURLの扱いまで決める必要が出る。

## Consequences
- 公開設定は、フォロー機能を検討する段階で一緒に追加を検討する。URLの形を先に揃えておくので、作り直しにはならない（0004）。

## Related
- [0004-no-mvp-only-non-scaling-design](./0004-no-mvp-only-non-scaling-design.md)
- [0008-tiered-auth-anonymous-and-email-otp](./0008-tiered-auth-anonymous-and-email-otp.md)
- [0014-browse-screen-scope](./0014-browse-screen-scope.md)
