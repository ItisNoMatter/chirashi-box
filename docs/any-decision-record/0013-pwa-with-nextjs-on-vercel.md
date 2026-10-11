# 0013: PWAとして作り、フロントエンドはNext.js（App Router）+ Vercelにする

- Date: 2026-10-11
- Status: Accepted
- Category: architecture
- Deciders: the user, Claude Code

## Context
想定する利用者（ういぴさん）はiPhoneユーザーで、開発者はMacを持っていない。アプリの中心は一覧・記録・検索で、カメラやバックグラウンド処理のようなネイティブ機能はほぼ要らない。利用者の反応を見ながら直すサイクルを速く回したい。

## Decision
- ネイティブアプリではなくPWAとして作り、URLを送って「ホーム画面に追加」してもらう形で配る。
- フロントエンドはNext.js（App Router）で書き、Vercelでホスティングする。PWAのmanifestは `app/manifest.ts` で書く。

## Alternatives
- Expo（React Native）: EAS BuildでMacなしでもiOS向けにビルドできるが、配るにはTestFlightとApple Developer Program（年会費）が必要で、最初の段階では手間に見合わない。ネイティブアプリ化が必要になったときの移行先の候補として残す。
- Kotlin Multiplatform（Compose Multiplatformのweb版を含む）: 開発者の得意分野だが、iOSのビルドにはMacが必要。web版でPWAを作る手もあるが、日本語入力やiOS Safariでの挙動に不安が残る。
- SvelteKit: Service Workerを標準でサポートし、書く量も少ないが、Supabaseの例やエコシステムはNext.jsより薄い。Service Workerを本格的に使う機能（通知）は、まだ要否が決まっていない。

## Consequences
- App Storeの審査も年会費も不要で、更新はすぐ利用者に届く。
- iPhoneにはPWAのインストールを促す仕組みがないため、共有ボタンから「ホーム画面に追加」する手順を一度案内する必要がある。
- プッシュ通知は、ホーム画面に追加したPWAでしか使えない。通知を入れる場合は、Serwistなどの追加ライブラリでService Workerを用意する。
- 端末内の保存データは消えることがあるので、記録はサーバー側に持たせる。

## Related
- [0001-use-typescript-for-extraction-pipeline](./0001-use-typescript-for-extraction-pipeline.md)
- [0008-tiered-auth-anonymous-and-email-otp](./0008-tiered-auth-anonymous-and-email-otp.md)
