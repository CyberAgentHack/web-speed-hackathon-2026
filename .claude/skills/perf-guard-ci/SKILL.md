---
name: perf-guard-ci
description: コード変更後にレギュレーション違反とパフォーマンス回帰を自動チェックする。「変更チェックして」「コミットして大丈夫？」「壊してない？」「回帰ない？」といった場面で使う。詳細なレギュレーション確認には regulation-guard、フル検証には perf-validate を使うこと。
---

# 回帰防止エージェント

## CRITICAL: 動作原則

- 変更ファイルに基づいてリスクレベルを自動判定する
- リスクレベルに応じた最小限の検証を実行する（過剰検証しない）
- 最終判定を SAFE / WARNING / BLOCKED の 3 段階で報告する
- BLOCKED の場合は修正箇所を具体的に示す

## ワークフロー

### Step 1: 変更ファイルの検出

```bash
git diff --name-only HEAD
git diff --name-only && git diff --name-only --cached
```

### Step 2: リスクレベル判定

| 変更対象パターン | VRT | 手動テスト | DB初期化 | SSE | fly.toml |
|----------------|-----|----------|---------|-----|---------|
| `*.css`, Tailwind クラス | HIGH | MEDIUM | - | - | - |
| `index.html` | HIGH | MEDIUM | - | - | - |
| `containers/**`, `components/**` | HIGH | HIGH | - | - | - |
| `routes/api/initialize*` | - | - | HIGH | - | - |
| `routes/api/crok*` | - | HIGH | - | HIGH | - |
| `server/seeds/**` | - | HIGH | HIGH | - | - |
| `fly.toml` | - | - | - | - | HIGH |
| `webpack.config.js` | MEDIUM | - | - | - | - |
| `utils/fetchers.ts` | - | HIGH | - | - | - |
| `package.json` | MEDIUM | MEDIUM | - | - | - |
| その他 `*.ts`, `*.tsx` | - | - | - | - | - |

- HIGH が 1 つでもある → リスクレベル HIGH
- MEDIUM のみ → リスクレベル MEDIUM
- それ以外 → リスクレベル LOW

### Step 3: リスクレベル別の検証

#### HIGH リスク
フル検証:
1. Build
2. レギュレーション全項目 (DB初期化, SSE, シードID, fly.toml)
3. VRT

#### MEDIUM リスク
部分検証:
1. Build
2. レギュレーション項目のみ (VRT はスキップ)

#### LOW リスク
ビルド確認のみ:
```bash
cd application && pnpm run build
```

### Step 4: パフォーマンス回帰チェック（オプション）

前回計測結果がある場合:
1. perf-measure で再計測
2. perf-regression-diff で比較
3. スコアが 5 点以上悪化したメトリクスがあれば WARNING

### Step 5: 最終判定

| 判定 | 条件 |
|------|------|
| **SAFE** | 全チェック PASS + スコア回帰なし |
| **WARNING** | 全チェック PASS だがスコア微悪化（5 点未満） |
| **BLOCKED** | いずれかのチェックが FAIL |

## Quick Reference

| 項目 | 値 |
|------|-----|
| 判定 | SAFE / WARNING / BLOCKED |
| リスクレベル | HIGH / MEDIUM / LOW |
| 使用スキル | regulation-guard, perf-validate, perf-measure, perf-regression-diff |
