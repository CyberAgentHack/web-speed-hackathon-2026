# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

Web Speed Hackathon 2026 の競技リポジトリ。架空の SNS「CaX」を高速化することが目的。採点は Lighthouse で行われる（1150点満点）。

## コマンド

全コマンドは `application/` ディレクトリ内で実行する。

### セットアップ

```bash
# ルートディレクトリで mise を有効化（Node.js / pnpm バージョン管理）
mise trust && mise install

# application/ で依存パッケージをインストール
cd application && pnpm install --frozen-lockfile
```

### ビルド・起動

```bash
# クライアントをビルド（application/ で実行）
pnpm run build

# サーバーを起動（application/ で実行）
pnpm run start
# → http://localhost:3000 でアクセス
```

### 型チェック・フォーマット

```bash
pnpm run typecheck        # 全ワークスペースの型チェック
pnpm run format           # oxlint + oxfmt で自動修正
```

### E2E テスト（VRT）

```bash
# Playwright の Chromium をインストール
pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium

# VRT 実行（事前にサーバー起動が必要）
pnpm run test

# スクリーンショットを更新してから VRT 実行
pnpm run test:update

# リモート環境に対してテスト
E2E_BASE_URL=https://example.com pnpm run test
```

### シード

```bash
# server/ ディレクトリで実行
pnpm --filter @web-speed-hackathon-2026/server run seed:generate
pnpm --filter @web-speed-hackathon-2026/server run seed:insert
```

## アーキテクチャ

### ディレクトリ構成

```
/
├── application/          # CaX アプリケーション（pnpm workspaces）
│   ├── client/           # フロントエンド
│   ├── server/           # バックエンド
│   └── e2e/              # Playwright VRT・E2E テスト
├── docs/                 # レギュレーション・採点・デプロイ説明
└── scoring-tool/         # ローカル採点ツール
```

### フロントエンド（`application/client/`）

- **React 19** + **React Router v7** + **Redux**（redux-form 専用。アプリ状態は props で管理）
- **Webpack 5** + **Babel** でビルド（`NODE_ENV=development` でビルドされる）
- エントリポイント: `src/index.tsx` → `AppContainer` がルーティングを担う
- `src/containers/` がデータフェッチ・ロジック、`src/components/` が描画を担う分離構成
- API 通信は `src/utils/fetchers.ts` に集約（jQuery の `$.ajax` を使用、`async: false` の同期 XHR）
- ログイン中ユーザーは `AppContainer` が保持し、子コンポーネントへ props で渡す

### バックエンド（`application/server/`）

- **Express 5** + **Sequelize** + **SQLite**
- API は `/api/v1/*` に集約（`src/routes/api/`）
- **初期化 API の仕様**: `POST /api/v1/initialize` が呼ばれると、`sequelize.ts` が master の SQLite ファイルを tmpdir にコピーして再接続する
- レスポンスはすべて `Cache-Control: max-age=0, no-transform` が付与されている
- Crok（AI チャット）エンドポイント（`GET /api/v1/crok`）は Server-Sent Events で実装。SSE プロトコルの変更は禁止

### パフォーマンス上の問題点（意図的に劣化させてある箇所）

競技課題として以下が含まれている（最適化の余地）:

- `fetchers.ts`: jQuery の `async: false`（同期 XHR）でブロッキング通信
- `fetchers.ts`: `sendJSON` がリクエストを pako で gzip 圧縮してから送信
- クライアント依存: `@ffmpeg/ffmpeg`・`@imagemagick/magick-wasm`・`@mlc-ai/web-llm` など重量級 WASM ライブラリを含む
- 検索: BM25 をクライアントサイドで実行（`src/utils/bm25_search.ts`）、形態素解析に kuromoji を使用
- サーバー: `Cache-Control: max-age=0, no-transform` でキャッシュ無効化

## レギュレーション上の注意点

- `fly.toml` の変更禁止
- VRT（`application/e2e/`）が失敗しないこと
- `GET /api/v1/crok` の SSE プロトコル変更禁止
- `POST /api/v1/initialize` でデータが初期状態にリセットできること
- シード変更時、各種 ID を変更してはならない

## 採点指標

Lighthouse ベース（合計 1150 点）:
- **ページ表示** 900 点: FCP × 10、Speed Index × 10、LCP × 25、TBT × 30、CLS × 25 の 9 ページ分
- **ページ操作** 250 点: TBT × 25、INP × 25 の 5 シナリオ（ページ表示で 300 点以上の場合のみ採点）

## デプロイ

fork したリポジトリから上流へ PR を作成すると GitHub Actions で fly.io に自動デプロイされる。
