---
name: regulation-guard
description: パフォーマンス改善でレギュレーション（VRT、手動テスト、DB 初期化、SSE プロトコル、fly.toml）を壊していないかを詳細チェックする。「レギュレーション大丈夫？」「壊してない？」「コミット前に確認したい」といった場面で使う。ビルド+テストの一括検証には perf-validate を使うこと。
---

# レギュレーション・ガードスキル

## CRITICAL: 失格リスク

このコンペティションでは、レギュレーション違反で順位対象外になる。最適化よりもレギュレーション遵守が優先。

## perf-validate との違い

- **perf-validate**: ビルド+バンドルサイズ+レギュレーション+テストの一括検証
- **regulation-guard**: レギュレーションの詳細チェックと失格リスクの判定に特化

## レギュレーション項目

### 1. VRT 通過

要件: Playwright の VRT が通ること。

```bash
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test
```

破壊しやすいケース:
- CSS の変更（Tailwind クラス変更、スタイル修正）
- HTML 構造の変更
- フォントの変更や除去

### 2. 手動テスト項目通過

要件: `docs/test_cases.md` に記載された全項目が通ること。

主な確認ポイント:
- 各ページのタイトル (`<title>`)
- 動画の自動再生
- 音声の波形表示
- 写真の枠を覆う拡縮 (object-fit: cover)
- サインイン/新規登録/サインアウト
- 投稿機能 (テキスト, TIFF 画像, WAV 音声, MKV 動画)
- DM のリアルタイム更新
- Crok の SSE ストリーミング + Markdown レンダリング
- 検索の感情分析

### 3. DB 初期化エンドポイント

要件: `POST /api/v1/initialize` で DB を初期状態にリセットできること。

```bash
curl -X POST http://localhost:3000/api/v1/initialize
```

破壊しやすいケース:
- DB スキーマ変更で seed データと不整合
- ルーティング変更でエンドポイントが消える

関連ファイル: `application/server/src/routes/api/initialize.ts`

### 4. SSE プロトコル

要件: `GET /api/v1/crok{?prompt}` の Server-Sent Events プロトコルを変更しないこと。

```bash
curl -N "http://localhost:3000/api/v1/crok?prompt=hello"
```

破壊しやすいケース:
- crok.ts のレスポンス形式を変更
- SSE 以外の方法（WebSocket 等）で情報を伝達

関連ファイル: `application/server/src/routes/api/crok.ts`

### 5. fly.toml 不変

要件: fly.toml を変更しないこと（Fly.io デプロイ時）。

```bash
git diff fly.toml
```

### 6. シード ID 不変

要件: シードの各種 ID を変更しないこと。

```bash
git diff application/server/seeds/
```

## 変更種別ごとのリスクマップ

| 変更対象 | VRT | 手動テスト | DB初期化 | SSE | fly.toml |
|---------|-----|----------|---------|-----|---------|
| `*.css`, Tailwind クラス | **HIGH** | MEDIUM | - | - | - |
| HTML テンプレート (`index.html`) | **HIGH** | MEDIUM | - | - | - |
| コンポーネント (`containers/`, `components/`) | **HIGH** | **HIGH** | - | - | - |
| `routes/api/initialize.ts` | - | - | **HIGH** | - | - |
| `routes/api/crok.ts` | - | - | - | **HIGH** | - |
| `server/seeds/`, DB スキーマ | - | **HIGH** | **HIGH** | - | - |
| `fly.toml` | - | - | - | - | **HIGH** |
| `webpack.config.js` | MEDIUM | - | - | - | - |
| `package.json` 依存変更 | MEDIUM | MEDIUM | - | - | - |
| `utils/fetchers.ts` (jQuery) | - | **HIGH** | - | - | - |
| メディア処理 (ffmpeg, imagemagick) | - | **HIGH** | - | - | - |

## Quick Reference

| 項目 | 値 |
|------|-----|
| VRT テスト | `cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test` |
| 手動テスト項目 | `docs/test_cases.md` |
| DB 初期化 | `application/server/src/routes/api/initialize.ts` |
| SSE エンドポイント | `application/server/src/routes/api/crok.ts` |
| fly.toml | プロジェクトルート |
| Seed データ | `application/server/seeds/` |
