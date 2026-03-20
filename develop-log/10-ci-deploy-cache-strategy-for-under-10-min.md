# 10 CI Deploy Cache Strategy for Under 10 Min

## 背景

「ビルド＆デプロイが約1時間」という課題に対し、最も効くボトルネックは Fly 側の都度ビルドと、同一PRでの重複ジョブ実行だった。

## 実施内容

- `.github/workflows/deploy-pr.yml` を刷新
  - `permissions.packages: write` を追加し、GHCR へ push 可能に変更
  - `docker/setup-buildx-action` を導入
  - `docker/login-action` で GHCR ログイン
  - `docker/build-push-action` でイメージを事前ビルド＆push
    - `cache-from: type=gha,scope=review-app`
    - `cache-to: type=gha,mode=max,scope=review-app`
    - BuildKit キャッシュを有効化
  - Fly へのデプロイは `superfly/fly-pr-review-apps` に `image` を渡す方式へ変更
    - Fly 側のDockerビルドをスキップし、既成イメージをデプロイ
  - `closed` イベント時は別ステップでPRアプリ削除を継続
  - `concurrency.cancel-in-progress: true` を有効化し、古い実行を中断

## 期待効果

- 初回以降のビルドキャッシュヒット率向上
- Fly 側ビルド待ちの削減
- 同一PRでの「古いジョブ完走待ち」の解消
- 全体で10分台に近づけるための主要施策を適用

## リスクと対策

- リスク: GHCR push 権限不足時にデプロイ失敗
- 対策: job permissions を明示し、`GITHUB_TOKEN` でログインする構成に統一

- リスク: `closed` 時に `image` 前提ステップが走ると失敗
- 対策: `closed` とそれ以外を `if` で明確に分岐

## 検証結果

- YAML 構文と分岐ロジックを確認
- ローカル採点計測は方針により未実施
