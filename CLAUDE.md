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

# バンドル解析（dist/report.html に出力）
ANALYZE=true NODE_ENV=production pnpm --filter @web-speed-hackathon-2026/client build
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
- **Webpack 5** + **Babel** でビルド（`NODE_ENV=production` でビルドされる）
- **TailwindCSS v4** を PostCSS 経由でビルド時に処理（CDN 不使用）
- エントリポイント: `src/index.tsx` → `AppContainer` がルーティングを担う
- ルートコンテナは `React.lazy` + `Suspense` で遅延ロード
- `src/containers/` がデータフェッチ・ロジック、`src/components/` が描画を担う分離構成
- API 通信は `src/utils/fetchers.ts` に集約（`fetch` API 使用、`HttpError` クラスでエラー統一）
- ログイン中ユーザーは `AppContainer` が保持し、子コンポーネントへ props で渡す

#### 主要な実装方針

- **画像表示**: `CoveredImage` は `object-fit: cover`、`AspectRatioBox` は CSS `aspect-ratio` で実装
- **日付フォーマット**: `src/utils/format_date.ts` で `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` を使用
- **検索トークナイズ**: `Intl.Segmenter("ja", { granularity: "word" })` でトークン分割（kuromoji 不使用）
- **センチメント解析**: `Intl.Segmenter` + `negaposi-analyzer-ja`（kuromoji 不使用）
- **翻訳**: `POST /api/v1/translate` サーバーAPIを呼び出す（Web LLM 不使用）
- **音声・動画アップロード**: 生ファイルをそのままサーバーに送信し、サーバー側で変換

### バックエンド（`application/server/`）

- **Express 5** + **Sequelize** + **SQLite**
- API は `/api/v1/*` に集約（`src/routes/api/`）
- **初期化 API の仕様**: `POST /api/v1/initialize` が呼ばれると、`sequelize.ts` が master の SQLite ファイルを tmpdir にコピーして再接続する
- レスポンスには `Cache-Control: max-age=0, no-transform` が付与されている
- Crok（AI チャット）エンドポイント（`GET /api/v1/crok`）は Server-Sent Events で実装。SSE プロトコルの変更は禁止

#### サーバー側変換処理

- **音声変換** (`src/utils/convert_to_mp3.ts`): `fluent-ffmpeg` + `@ffmpeg-installer/ffmpeg` で任意フォーマット → MP3
- **動画変換** (`src/utils/convert_to_gif.ts`): 同上で任意フォーマット → 5秒/10fps/正方形クロップ GIF
- **翻訳** (`src/routes/api/translate.ts`): `@vitalets/google-translate-api` で `POST /api/v1/translate`
- **音声メタデータ** (`src/utils/extract_metadata_from_sound.ts`): `music-metadata` で ID3 タグ読み取り

### 静的アセット

- `public/images/profiles/*.jpg`: プロフィール画像（256×256px にリサイズ済み）
- `public/images/*.jpg`: 投稿画像（幅 1152px にリサイズ済み）
- `public/movies/*.gif`: 投稿動画（GIF）
- `public/sounds/*.mp3`: 投稿音声

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
