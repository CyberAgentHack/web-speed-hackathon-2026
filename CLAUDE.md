# Web Speed Hackathon 2026

## プロジェクト概要

CyberAgent主催のWebパフォーマンス改善競技。架空SNS「CaX」のLighthouseスコアを改善する。

- **競技期間**: 2026/03/20 10:30 〜 03/21 18:30 JST
- **リーダーボード**: https://web-speed-hackathon-scoring-board-2026.fly.dev/

## 採点基準（合計1150点）

### ページの表示（900点）
9ページ × 100点（FCP / SI / LCP / TBT / CLS）

### ページの操作（250点）
5シナリオ × 50点（TBT / INP）

> **注意**: 「ページの表示」300点未満の場合、操作スコアが0点になる

## 主要コマンド

```bash
mise trust && mise install    # 初期セットアップ
pnpm install                  # 依存インストール
pnpm run build                # ビルド
pnpm run start                # サーバー起動 (localhost:3000)
pnpm run test                 # VRT実行
pnpm run test:update          # スクリーンショット更新
```

採点ツール（`/scoring-tool` ディレクトリから）:

```bash
pnpm start --applicationUrl <url>
```

## ディレクトリ構成

```
/application/workspaces/server  # サーバー実装
/application/workspaces/client  # クライアント実装
/application/workspaces/e2e     # E2EテストとVRT
/scoring-tool                   # ローカル採点ツール
/docs                           # ルール・テストケース
```

## レギュレーション

### 禁止事項（違反=失格）
- `fly.toml` の変更
- VRTと手動テスト項目の機能落ち
- 初期シードデータのIDを変えること
- 競技終了後のデプロイ更新
- `GET /api/v1/crok` のSSEプロトコル変更

### 必須事項
- `POST /api/v1/initialize` でDB初期化が機能すること
- 競技終了まで本番URLにアクセス可能であること

### 自由なこと
- コード・ファイルの変更すべて
- APIレスポンス内容の変更（追加・削除可）
- 外部SaaSの利用（有料費用は自己負担）

## VRT・手動テスト

- Playwrightを使ったVRT（スクリーンショット比較）
- `/docs/test_cases.md` の手動テスト項目を遵守
- 主要機能: タイムライン、投稿詳細、DM、Crok（AIチャット）、検索、認証

## 技術スタック

- **Node.js**: 24.14.0（mise管理）
- **pnpm**: 10.32.1
- **デプロイ**: fly.io（GitHub Actions経由）
- **テスト**: Playwright + Lighthouse 12.8.2
