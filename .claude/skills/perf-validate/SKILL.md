---
name: perf-validate
description: 施策実装後に「ビルド、バンドルサイズ、レギュレーション、VRT」を一括検証する。「壊れてない？」「チェックして」「テスト通る？」「ビルドできる？」「レギュレーション大丈夫？」といった場面で使う。スコア計測には perf-measure を使うこと。
---

# パフォーマンス検証スキル

## CRITICAL: このスキルの位置づけ

perf-measure の前にサニティチェックを通すことで、壊れた状態で計測するロスを防ぐ。
実装完了 → **perf-validate** → perf-measure の順で使う。

## ワークフロー

### Step 1: ビルド確認

```bash
cd application && pnpm run build
```

### Step 2: バンドルサイズ確認

```bash
# Webpack 出力先
ls -la application/dist/scripts/
ls -la application/dist/styles/
```

意図しない増加がないか、前回との差分を確認。

### Step 3: レギュレーションチェック

| # | チェック | 確認方法 | FAIL 時の対処 |
|---|---------|---------|-------------|
| 1 | DB initialize | `curl -X POST http://localhost:3000/api/v1/initialize` が成功するか | `application/server/src/routes/api/initialize.ts` を確認 |
| 2 | SSE プロトコル | `curl -N "http://localhost:3000/api/v1/crok?prompt=test"` で SSE レスポンスが返るか | `application/server/src/routes/api/crok.ts` を確認 |
| 3 | シード ID | seed データの ID が変更されていないか | `application/server/seeds/` を確認 |
| 4 | fly.toml | `fly.toml` が変更されていないか | `git diff fly.toml` で確認 |
| 5 | VRT | Playwright スクリーンショット比較が通るか | 下記 Step 4 |

### Step 4: VRT テスト

```bash
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium
cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test
```

VRT が通らない場合:
- スクリーンショット差分を確認して CSS/HTML を修正
- 意図的な変更の場合: `pnpm --filter "@web-speed-hackathon-2026/e2e" run test:update`

### Step 5: 全チェック通過後

全チェックが PASSED なら perf-measure で再計測して効果を確認する。

## よくあるミス

| ミス | 対策 |
|------|------|
| ビルドせずにテスト実行 | ビルド済みでない場合は先にビルドする |
| VRT 差異を無視して計測に進む | VRT 不合格は失格リスク。先に修正する |
| Crok SSE を壊して気づかない | SSE ストリーミングの動作確認を忘れない |
| fly.toml を変更してしまう | Fly.io デプロイ時に失格になる |

## Quick Reference

| 項目 | 値 |
|------|-----|
| ビルドコマンド | `cd application && pnpm run build` |
| テストコマンド | `cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test` |
| ビルド出力先 | `application/dist/` |
| レギュレーション項目 | DB初期化, SSEプロトコル, シードID, fly.toml, VRT |
