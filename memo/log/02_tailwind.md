# Tailwind CSS ビルド時処理への移行

## 変更内容

- `@tailwindcss/vite` をインストール、`vite.config.ts` にプラグイン追加
- `index.html` から CDN `<script src="@tailwindcss/browser">` と `<style type="text/tailwindcss">` を削除
- `index.css` に `@import "tailwindcss"` + テーマ (`@theme`) / ユーティリティ (`@utility markdown`) / `@layer base` 定義を統合
- `UserProfileHeader.tsx`: 動的 Tailwind クラス `bg-[${averageColor}]` を inline style (`backgroundColor`) に修正
  - ビルド時スキャンでは動的に構築されるクラス名を検出できないため
  - ref: https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names

## 計測結果

合計 **241.90 / 1150 点** （前回 238.90 → **+3.00**）

| ページ       | 前回  | 今回  | 差分  |
| ------------ | ----- | ----- | ----- |
| ホーム       | 18.50 | 18.50 | ±0    |
| 投稿詳細     | 26.20 | 25.30 | -0.90 |
| 写真投稿詳細 | 24.75 | 24.75 | ±0    |
| 動画投稿詳細 | 23.75 | 23.75 | ±0    |
| 音声投稿詳細 | 25.00 | 25.00 | ±0    |
| 検索         | 25.30 | 25.90 | +0.60 |
| DM一覧       | 32.20 | 34.30 | +2.10 |
| DM詳細       | 31.00 | 33.40 | +2.40 |
| 利用規約     | 32.20 | 31.00 | -1.20 |

ユーザーフロー: 300点未満のためスキップ

## 分析

- TBT が DM系ページで改善（CDN JS読み込み + ランタイムDOM解析が不要になった分）
- FCP / LCP / SI は依然すべて 0 点 → 巨大 JS バンドル (12MB) が根本ボトルネック
