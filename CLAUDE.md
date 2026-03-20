# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Web Speed Hackathon 2026 の競技用SNSアプリ「CaX」。重たいWebアプリのパフォーマンスを改善して Lighthouse スコアを競う。

## セットアップ

```bash
mise trust && mise install
cd application
pnpm install --frozen-lockfile
```

## 開発コマンド

```bash
# ビルド（クライアント）
cd application && pnpm run build

# サーバー起動（http://localhost:3000/）
cd application && pnpm run start

# 型チェック（全パッケージ）
cd application && pnpm run typecheck

# リント・フォーマット
cd application && pnpm run format

# シードデータ生成・投入
cd application && pnpm --filter @web-speed-hackathon-2026/server run seed:generate
cd application && pnpm --filter @web-speed-hackathon-2026/server run seed:insert
```

## E2E テスト (VRT)

```bash
# Playwright Chromium インストール
cd application && pnpm --filter @web-speed-hackathon-2026/e2e exec playwright install chromium

# VRT 実行（ローカル、サーバー起動済みであること）
cd application && pnpm run test

# スクリーンショット更新（環境差異のため初回推奨）
cd application && pnpm run test:update

# リモート環境に対して実行
cd application && E2E_BASE_URL=https://example.com pnpm run test
```

## アーキテクチャ

pnpm workspace モノレポ。`application/pnpm-workspace.yaml` で管理。

- `application/client/` — React 19 + Redux + React Router 7 のSPA。Webpack 5 でバンドル。jQuery による API 通信（`src/utils/fetchers.ts`）
- `application/server/` — Express 5 + Sequelize 6 (SQLite3)。セッション認証。WebSocket/SSE 対応
- `application/e2e/` — Playwright による VRT・E2E テスト
- `scoring-tool/` — Lighthouse ベースのパフォーマンス計測ツール

### クライアント構成
- `src/containers/` — ページレベルコンポーネント（ルーティングは `AppContainer.tsx`）
- `src/components/` — 再利用可能UIコンポーネント
- `src/hooks/` — カスタムフック（`use_fetch`, `use_sse`, `use_ws`, `use_infinite_fetch` 等）
- `src/utils/` — API通信、メディア変換（FFmpeg/ImageMagick WASM）、検索、感情分析等

### サーバー構成
- `src/routes/api/` — REST API エンドポイント（`api.ts` がルーター）
- `src/models/` — Sequelize モデル（User, Post, Comment, DirectMessage, Image, Movie, Sound 等）
- `src/seeds.ts` — DB初期化・シードデータ

### ビルド設定の特徴（意図的に非最適化）
- Webpack: mode "none"、splitChunks 無効、minimize 無効
- Babel: IE11 ターゲット、useBuiltIns false
- core-js/regenerator-runtime をエントリーに含む
- jQuery でバイナリ転送

## 競技レギュレーション

### 禁止事項
- VRT を失敗させるデザイン変更
- `fly.toml` の変更
- `GET /api/v1/crok{?prompt}` の SSE プロトコル変更
- crok-response に必要な情報を SSE 以外で伝達
- シードの各種 ID の変更

### 必須要件
- `POST /api/v1/initialize` でDBが初期値にリセットされること
- アプリケーションがアクセス可能な状態を維持すること

## 採点基準（1150点満点）

### ページ表示（900点 = 9ページ × 100点）
FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25

### ページ操作（250点 = 5シナリオ × 50点）
TBT×25 + INP×25
※ページ表示で300点以上の場合のみ採点

## ツールチェーン
- Node.js 24.14.0 / pnpm 10.32.1（mise で管理）
- oxlint + oxfmt（リント・フォーマット）
- TypeScript strict モード（`@tsconfig/strictest` 継承）
- デプロイ: Fly.io (nrt リージョン、ポート 8080)
