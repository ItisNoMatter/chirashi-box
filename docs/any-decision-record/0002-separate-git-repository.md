# 0002: chirashi-boxを親リポジトリから独立したGitリポジトリにする

- Date: 2026-10-10
- Status: Accepted
- Category: tooling
- Deciders: the user, Claude Code

## Context
`chirashi-box/` は、課題のCファイルなどが雑多に置かれた親リポジトリ `inoma_dev_repository` のサブディレクトリとして作られていた。一方、構成はGitHub Actionsのcron（美術館サイトの巡回）とVercelのデプロイを前提にしており、どちらもGitHubリポジトリ単位で動く。

## Decision
`chirashi-box/` で `git init` して独立したリポジトリにし、GitHubにprivateリポジトリとして作成する。親リポジトリの `.gitignore` には `chirashi-box/` を追加する。

## Alternatives
- 親リポジトリのサブディレクトリのまま運用する（VercelのRoot Directoryや、Actionsの `working-directory` で対応）: 無関係なファイルが多い親リポジトリにcronやVercel連携をつなぐのは不自然なため却下。
- publicリポジトリにする: 巡回する館のリストやLLMプロンプトを公開してよいかが未検討のため、最初はprivateにする。build in publicで公開したくなったら後から切り替えられる。

## Consequences
- GitHub Actions・Vercelをリポジトリ単位で素直に設定できる。
- 親リポジトリの `git status` にchirashi-boxの変更が出なくなる。
