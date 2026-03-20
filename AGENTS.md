# AGENTS.md

このファイルは、このリポジトリで作業するエージェント向けの運用ガイドです。実装前に `README.md`、`docs/regulation.md`、`docs/scoring.md`、`docs/development.md` を確認してください。

## 目的

- このリポジトリは Web Speed Hackathon 2026 の課題「CaX」です。
- 目的は、機能や見た目を壊さずに Web アプリケーションのパフォーマンスを改善し、採点スコアを上げることです。

## リポジトリ構成

- `/application`
  - CaX 本体の pnpm workspace です。
  - `/application/client`
    - React 19 + React Router 7 + Redux ベースのフロントエンドです。
    - バンドラは webpack です。
  - `/application/server`
    - Express 5 + Sequelize + SQLite ベースの API / 静的配信サーバーです。
  - `/application/e2e`
    - Playwright による E2E / VRT です。
- `/scoring-tool`
  - Lighthouse と Playwright を使った採点ツールです。
- `/docs`
  - 開発方法、デプロイ、採点、レギュレーション、テスト観点がまとまっています。

## セットアップ

- 必須ツール
  - `mise`
  - Node.js `24.14.0`
  - pnpm `10.32.1`
- 初回セットアップ
  - `mise trust`
  - `mise install`

## よく使うコマンド

- アプリケーション依存関係のインストール
  - `cd application && pnpm install --frozen-lockfile`
- アプリケーションのビルド
  - `cd application && pnpm run build`
- アプリケーションの起動
  - `cd application && pnpm run start`
- 型チェック
  - `cd application && pnpm run typecheck`
- フォーマット
  - `cd application && pnpm run format`
- E2E / VRT 実行
  - `cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium`
  - 別ターミナルでアプリを起動した上で `cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test`
- スコア計測
  - `cd scoring-tool && pnpm install --frozen-lockfile`
  - `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000`
  - 特定の計測だけ再実行する場合は `--targetName` を使う
    - 例: `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "投稿"`

## アーキテクチャ概要

- フロントエンドのエントリーポイントは `application/client/src/index.tsx` です。
- 主要ルートは `application/client/src/containers/AppContainer.tsx` にあります。
  - `/`
  - `/dm`
  - `/dm/:conversationId`
  - `/search`
  - `/users/:username`
  - `/posts/:postId`
  - `/terms`
  - `/crok`
- サーバーのエントリーポイントは `application/server/src/index.ts` です。
- API ルーターは `application/server/src/routes/api.ts` に集約されています。
- 静的配信は `application/server/src/routes/static.ts` で行われます。
- サーバーは以下のディレクトリを配信対象にしています。
  - `application/public`
  - `application/upload`
  - `application/dist`

## データと初期化

- SQLite の元データは `application/server/database.sqlite` にあります。
- 起動時、`application/server/src/sequelize.ts` で DB を一時ディレクトリへコピーして利用します。
- `POST /api/v1/initialize` は採点上必須です。
  - DB を初期状態へ戻します。
  - セッションストアをクリアします。
  - `application/upload` を削除します。
- シードを変更してもよいですが、初期データに含まれる各種 ID は変更禁止です。
- `application/e2e/globalSetup.ts` もテスト開始時に `POST /api/v1/initialize` を呼びます。
- `scoring-tool` も計測前に `POST /api/v1/initialize` を呼ぶ前提です。

## 競技上の重要ルール

- `fly.toml` は変更禁止です。
- Chrome 最新版で、著しい機能落ちやデザイン差異を発生させてはいけません。
- VRT と手動テストを通す必要があります。
- `GET /api/v1/crok{?prompt}` の SSE プロトコルは変更禁止です。
- `crok-response.md` と同等の画面構成に必要な情報を、SSE 以外で渡してはいけません。
- 競技終了後のレギュレーションチェック時まで、アプリケーションにアクセス可能である必要があります。

## 採点観点

- 採点は大きく次の 2 系統です。
  - ページ表示
  - ページ操作
- ページ表示で 300 点未満だと、ページ操作は採点されません。
- まずは表示系スコアを優先してください。
- 表示系では以下が重要です。
  - FCP
  - Speed Index
  - LCP
  - TBT
  - CLS
- 操作系では以下が重要です。
  - TBT
  - INP

## パフォーマンス改善時の実務方針

- 変更前後で、少なくとも以下を確認してください。
  - `pnpm run build`
  - 必要に応じて `pnpm run typecheck`
  - 影響箇所の E2E / VRT
  - `scoring-tool` による対象ページまたは対象フローの再計測
- まず疑うポイント
  - 初回ロードで不要な巨大依存の読込
  - 画像、動画、音声、フォントの配信方法
  - バンドル分割不足
  - 不要な再描画
  - API レスポンスの過大取得
  - 同期的で重いクライアント処理
  - キャッシュ戦略不足
- このリポジトリでは、フロントの webpack 設定で最適化がかなり抑制されています。
  - `minimize: false`
  - `splitChunks: false`
  - `concatenateModules: false`
  - `cache: false`
  - 変更時は、機能差異とビルド結果をよく確認してください。
- 明確なホットスポット候補
  - `application/server/src/routes/api/crok.ts`
    - SSE の最初の出力前に `sleep(3000)` があります。
    - その後も 1 文字ごとに `sleep(10)` で送信しています。
    - レギュレーション上、SSE プロトコルと必要情報は維持しつつ、実装の高速化余地があります。

## 変更時の注意

- 既存の API 契約や画面挙動を壊さないことを最優先にしてください。
- 採点対象ページとフローを意識して、変更の影響範囲を限定してください。
- 大きな改善を入れる場合も、以下は必ず維持してください。
  - 既存 URL
  - 初期化 API
  - 認証、DM、検索、投稿、Crok、利用規約画面
- 配信アセットの変更では、VRT 差分とロード時間の両方を確認してください。

## 参照するとよいファイル

- `README.md`
- `docs/development.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/scoring-scenarios.md`（採点ツールの URL・操作シナリオ詳細）
- `docs/test_cases.md`
- `application/README.md`
- `scoring-tool/README.md`
- `application/server/openapi.yaml`

## 不明点があるとき

- レギュレーションや採点結果に影響する変更は、推測で進めずに確認してください。
- 特に以下は要確認です。
  - 見た目の差異を伴う UI 変更
  - Crok の通信仕様変更
  - デプロイ方法に関わる変更
  - seed / initialize の仕様変更
