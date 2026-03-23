# CLAUDE.md

## プロジェクト概要

Web Speed Hackathon 2026 (CaX) — Twitter/X 風 SNS アプリケーションの Lighthouse パフォーマンスチューニングコンペ。
スコアは Lighthouse ベースで 1150 点満点 (ページ表示 900 + ページ操作 250)。

- 採点方法: [docs/scoring.md](docs/scoring.md)
- 開発方法: [docs/development.md](docs/development.md)
- デプロイ方法: [docs/deployment.md](docs/deployment.md)
- 手動テスト項目: [docs/test_cases.md](docs/test_cases.md)
- チューニング前アーキテクチャ: [docs/architecture-before-tuning.md](docs/architecture-before-tuning.md)
- API ドキュメント (OpenAPI): [application/server/openapi.yaml](application/server/openapi.yaml)
- VRT: [application/README.md](application/README.md)

## レギュレーション (厳守)

詳細: [docs/regulation.md](docs/regulation.md)

- VRT (Visual Regression Test) が失敗しないこと
- [docs/test_cases.md](docs/test_cases.md) に記載された手動テスト項目が失敗しないこと
- `GET /api/v1/crok{?prompt}` の SSE プロトコルを変更しないこと
- SSE で送る情報を SSE 以外の方法で伝達しないこと
- `POST /api/v1/initialize` でデータベースが初期値にリセットされること
- シードデータの各種 ID を変更しないこと
- `fly.toml` を変更しないこと
- 著しい機能落ちやデザイン差異を発生させないこと

**重要: 運営からの警告**
- 多くの参加者に機能落ちによるレギュレーション違反が確認されている。
- チューニング時は E2E/VRT および手動テストケースを必ず確認し、元のアプリケーションから機能差分が発生しないよう細心の注意を払うこと。
- パフォーマンス改善と同時に機能維持もしっかりとケアする。
- 機能を棄損しかねない過度なパフォーマンス改善は行わないこと。

## ディレクトリ構成

```
application/
  client/          フロントエンド (React SPA, webpack)
  server/          バックエンド (Express 5, Sequelize, SQLite)
  e2e/             VRT (Playwright)
  public/          静的アセット
  dist/            ビルド成果物
  upload/          ユーザーアップロードファイル
scoring-tool/      採点ツール (Lighthouse ベース)
docs/              コンペドキュメント
plans/             修正プランドキュメント
performance/
  lighthouse/      Lighthouse 計測結果 (手動実行・手動配置)
  scoring_tool/    scoring-tool 計測結果 (ローカル: v*-local-*.md, 提出: v*-dev-*.md)
regression/        VRT 実行結果ログ
```

## データベース

- マスター (初期データ): `application/server/database.sqlite`
- 稼働中 (サーバー起動時にtempへコピー): `/var/folders/.../wsh-xxx/database.sqlite`
- DBeaver 等で参照する場合はマスターのパスを使用する

## 環境セットアップ

参照: [docs/development.md](docs/development.md)

```bash
mise trust && mise install
cd application && pnpm install --frozen-lockfile
```

## ビルド・起動

参照: [application/README.md](application/README.md)

```bash
cd application
pnpm run build    # client のビルド (webpack)
pnpm run start    # server 起動 (tsx, http://localhost:3000)
```

### 再ビルド・再起動

コード修正後に変更を反映するには、既存サーバーを停止してから再ビルド・再起動する。

```bash
# 1. 既存サーバーを停止
lsof -i :3000          # PID を確認
kill <PID>             # 確認した PID で停止

# 2. 再ビルド → 再起動
cd application && pnpm run build && pnpm run start
```

## コード規約

### 共通

- TypeScript strict モード (`@tsconfig/strictest` 拡張)
- ESM (`"type": "module"`)
- フォーマッタ: oxfmt, リンタ: oxlint
- パスエイリアス: `@web-speed-hackathon-2026/client/*`, `@web-speed-hackathon-2026/server/*`
- import 順序: 1) node 標準 → 2) 外部パッケージ → 3) プロジェクト内 (エイリアス) → 4) 相対パス。グループ間に空行を入れる
- 型の import は `import type { ... }` を使用する

### Frontend (client/)

- React 19 + React Router v7 (BrowserRouter, SPA)
- 状態管理: Redux (redux-form のみ、最小限の使用)
- CSS: Tailwind CSS v4 + PostCSS (postcss-import, postcss-preset-env stage 3)
- コンポーネント: 関数コンポーネント + hooks
- ファイル名: コンポーネントは PascalCase.tsx, ユーティリティは snake_case.ts
- コンテナ/プレゼンテーション分離: `containers/` に状態管理、`components/` に UI

### Backend (server/)

- Express 5.1 + Sequelize 6 (SQLite)
- ルートファイル: `server/src/routes/api/` 配下に機能単位で分割
- モデル: `server/src/models/` 配下、クラスベース (Sequelize Model 継承)
- WebSocket: Express に ws をモンキーパッチ (`router.ws()`)
- リアルタイム通知: EventEmitter (`eventhub.ts`) 経由
- セッション: express-session (MemoryStore)

## チューニング時の作業フロー

### 0. 修正プラン作成

修正プランは `plans/` 配下にドキュメントとして作成する。
プラン作成前に、以下の過去の計測結果・テスト結果を確認し、ボトルネックと改善余地を把握した上で戦略を立てること:

- `performance/scoring_tool/*` — scoring-tool の計測結果
- `performance/lighthouse/*` — Lighthouse の計測結果 (ユーザーが手動配置)
- `regression/*` — VRT 実行結果ログ

### 1. コード修正

プランに基づき変更を実施する。

### 2. ビルド確認

```bash
cd application && pnpm run build
```

ビルドエラーがないことを確認する。

### 3. パフォーマンス計測

参照: [scoring-tool/README.md](scoring-tool/README.md), [docs/scoring.md](docs/scoring.md)

サーバーを起動した状態で、別ターミナルから実行:

```bash
# サーバー起動 (未起動の場合)
cd application && pnpm run start

# 全項目計測
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000

# 特定項目のみ計測
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホームを開く"
```

スコアが向上していることを確認する。
「ページの表示」が 300 点以上でないとユーザーフローテストはスキップされる。
計測結果は `performance/scoring_tool/` に保存する。

**注意**: `performance/lighthouse/` の結果はユーザーが手動で Lighthouse を実行し配置する。Claude が自動配置しないこと。

### 4. Visual Regression Test

参照: [application/README.md](application/README.md)

```bash
cd application/e2e && pnpm run test:update 2>&1 | tee ../../regression/v*-local-*.txt
```

全テストが passed であることを確認する。
チューニングによりデザイン崩れが発生していないことを検証する。
実行結果のログは `regression/` 配下にバージョン名付きで保存する。
テスト項目の詳細は [docs/test_cases.md](docs/test_cases.md) を参照。

### 5. デプロイ後の VRT 確認

提出・デプロイ後に、デプロイ先の環境に対して VRT を実行し、本番環境でも機能が正常であることを確認する。

```bash
cd application/e2e && E2E_BASE_URL=<Deploy URL> pnpm run test
```

### 6. 提出結果の保存

ユーザーが提出後にスコアリングの issue URL を共有したら、`gh issue view` でスコアを取得し、
`performance/scoring_tool/v*-dev-<変更概要>.md` に変更内容・PR・スコア・VRT結果・考察をまとめて保存する。

### 参考: ベースラインスコア (チューニング前)

計測結果: [performance/lighthouse/localhost_before_tuning.json](performance/lighthouse/localhost_before_tuning.json)

| 区分 | スコア | 満点 |
|------|--------|------|
| ページの表示 | 288.25 | 900 |
| ページの操作 | 0 (スキップ) | 250 |
| 合計 | 288.25 | 1150 |
