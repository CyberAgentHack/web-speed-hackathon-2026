# Plan: v4 — TBT 改善 (最終提出)

## Context

v3 で 397.95点 (83位) を達成。FCP (0.73), LCP (0.88), CLS (1.00) は良好だが、
**TBT が全ページで 0点** (3,280ms) で、配点 270点分 (30点×9ページ) をほぼ失っている。
これが最大かつ最後の改善ポイント。

## ボトルネック

dev Lighthouse の Main Thread 分析:
- Script Evaluation: 3,325ms — `269.js` (vendor chunk) が 4,693ms
- Other: 4,412ms — **Tailwind CSS ブラウザランタイムの CSS コンパイル**
- GC: 1,393ms

**Tailwind CSS ブラウザランタイム** (`@tailwindcss/browser`) が `<script>` で読み込まれ、
HTML 内の `<style type="text/tailwindcss">` をブラウザ内でコンパイルしている。
これが TBT の最大原因。

## API 側の改善について

dev Lighthouse のサーバーレスポンスは 10ms 以下。API 最適化での劇的改善は見込めない。
TBT はクライアントサイドのメインスレッドブロッキングが原因なので、フロントエンド改善に集中する。

## 施策: Tailwind CSS ビルド時コンパイル化

### なぜ

`@tailwindcss/browser` は以下を行う:
1. CDN から JS (200KB+) をダウンロード
2. HTML 内の `<style type="text/tailwindcss">` をパース
3. 全ユーティリティクラスを解析
4. CSS を生成してスタイルに注入

これが全てメインスレッドで実行され、TBT を 3秒以上増加させている。

### 変更内容

1. `index.html` から `<script src="cdn.jsdelivr.net/@tailwindcss/browser">` を削除
2. `index.html` の `<style type="text/tailwindcss">` の内容を `index.css` に移動
3. Tailwind v4 の PostCSS プラグイン (`@tailwindcss/postcss`) をインストール
4. `postcss.config.js` に `@tailwindcss/postcss` を追加
5. webpack の既存 postcss-loader でビルド時にコンパイル

### 修正対象ファイル

- `client/src/index.html` — ブラウザランタイム script 削除、inline style 削除
- `client/src/index.css` — Tailwind テーマ・ユーティリティ定義を移動
- `client/postcss.config.js` — `@tailwindcss/postcss` 追加
- `client/package.json` — `@tailwindcss/postcss` 依存追加

### リスク

- CSS の見た目が変わる可能性が最も高い施策
- Tailwind v4 のビルド時コンパイルとブラウザランタイムで出力が微妙に異なる場合がある
- VRT で厳密に確認し、差分があれば CSS を調整

## 期待効果

| 指標 | v3 | v4 (予想) |
|------|-----|---------|
| TBT | 3,280ms (0点) | 500-1000ms (部分スコア) |
| TBT 合計得点 | ~5点/270点 | ~100-150点/270点 |
| ユーザーフロー TBT | 0点/125点 | 部分スコア |
| 合計 | 397点 | **500-600点** |

## 検証手順

1. `cd application && pnpm run build` — ビルド成功確認
2. ブラウザで確認: Tailwind CDN への通信がないこと (Network タブ)
3. CSS の見た目が変わっていないこと (目視 + VRT)
4. VRT: `cd application/e2e && pnpm run test:update`
5. scoring-tool でスコア計測
6. commit & push
