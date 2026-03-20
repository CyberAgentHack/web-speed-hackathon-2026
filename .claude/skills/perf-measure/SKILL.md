---
name: perf-measure
description: 採点対象 9 ページ + 5 フローの Lighthouse 計測と chrome-devtools トレースを実行し、構造化レポートを生成する。「スコアは？」「計測して」「ベースライン取りたい」「改善確認したい」といった場面で使う。改善提案には perf-propose、実装検証には perf-validate を使うこと。
---

# パフォーマンス計測スキル

## CRITICAL: 計測前の確認事項

- サーバーが起動していること（`http://localhost:3000` または Docker 経由 `http://localhost:8080`）
- Chrome ブラウザが起動していること（chrome-devtools MCP 用）
- 起動していない場合は `cd application && pnpm run build && pnpm run start` を案内

## ワークフロー

### Step 1: scoring-tool による計測（推奨）

scoring-tool が同梱されているため、公式の採点ツールを使って計測できる:

```bash
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000
```

特定の計測だけ実行したい場合:
```bash
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホーム"
```

計測名一覧を確認:
```bash
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName
```

### Step 2: Lighthouse 単体計測（個別ページの詳細が欲しい場合）

```bash
TIMESTAMP=$(date +%Y-%m-%d_%H%M)
mkdir -p perf-measurements/$TIMESTAMP

npx lighthouse http://localhost:3000/ \
  --output json \
  --output-path perf-measurements/$TIMESTAMP/home.json \
  --chrome-flags="--headless" \
  --only-categories=performance
```

同様に他のページも計測。

### Step 3: chrome-devtools トレース（低スコアページ 1-2 件）

1. `navigate_page` で対象ページに遷移
2. `performance_start_trace` (`reload: true`, `autoStop: true`)
3. Insights を記録
4. `performance_analyze_insight` で深掘り

注目インサイト: **LCPBreakdown**, **CLSCulprits**, **RenderBlocking**, **DocumentLatency**, **LCPDiscovery**

### Step 4: レポート作成

`perf-measurements/<TIMESTAMP>/report.md` に以下の形式でまとめる（TIMESTAMP は `YYYY-MM-DD_HHmm` 形式、例: `2026-03-20_1430`）:

```markdown
# パフォーマンス計測レポート

**計測日**: YYYY-MM-DD
**計測方法**: scoring-tool / Lighthouse CLI

## スコアサマリー

### ページ表示 (900点満点)
| ページ | Score | FCP | SI | LCP | TBT | CLS |
|--------|-------|-----|-----|-----|-----|-----|

### ページ操作 (250点満点)
| フロー | Score | TBT | INP |
|--------|-------|-----|-----|

## 配点ウェイト別の失点分析

| メトリクス | 配点 | 平均スコア | 失点 |
|-----------|------|----------|------|
| TBT | 30 | | |
| LCP | 25 | | |
| CLS | 25 | | |
| FCP | 10 | | |
| SI | 10 | | |

## chrome-devtools トレース結果
（Step 3 の結果を追記）
```

### Step 5: ユーザーへの報告

- スコアサマリーテーブルを提示
- 前回比較がある場合は変化を報告
- 「施策提案が必要なら perf-propose を呼んでください」と案内

## よくあるエラー

| エラー | 原因 | 対処 |
|-------|------|------|
| `Connection refused` | サーバーが起動していない | `cd application && pnpm run start` で起動 |
| Lighthouse が途中で止まる | ページ読み込みタイムアウト | `--max-wait-for-load=60000` を追加 |
| scoring-tool でエラー | Playwright 未インストール | `cd scoring-tool && pnpm install` |

## 計測判断の落とし穴

| 落とし穴 | 対策 |
|---------|------|
| 単発スコアで施策を否定 | 再計測 + メトリクス絶対値で確認する |
| スコア上は悪化だが改善は正しい | 閾値帯手前の改善はスコアに出にくい。LCP 秒数や転送量を見る |
| ルート平均で見て局所改善を見逃す | ルート別の差分を必ず見る |
| TBT のぶれで全体スコアが変動 | TBT は配点 30 だがぶれも大きい。他メトリクスも併せて判断 |
| ページ表示300点未満でフロー未採点 | まずランディング改善を優先する |

## Quick Reference

| 項目 | 値 |
|-----|-----|
| 採点ページ (表示) | `/`, `/posts/:id` (4種), `/dm`, `/dm/:id`, `/search`, `/terms` |
| 採点フロー (操作) | 認証, DM, 検索, Crok, 投稿 |
| 配点ウェイト (表示) | TBT:30, LCP:25, CLS:25, FCP:10, SI:10 |
| 配点ウェイト (操作) | TBT:25, INP:25 |
| 計測結果格納先 | `perf-measurements/<TIMESTAMP>/` (TIMESTAMP = `YYYY-MM-DD_HHmm` 形式) |
| スコア以外に見るべき値 | 転送サイズ, request 数, LCP 発見経路, long task |
| scoring-tool | `cd scoring-tool && pnpm start --applicationUrl <URL>` |
