# 27. 画像の loading="lazy" 除去 (2026-03-21)

## 変更内容

CoveredImage コンポーネントから `loading="lazy"` を除去。ブラウザデフォルトの `eager` に戻す。

## 理由

全画像に `loading="lazy"` が付いていたため、ファーストビュー（above-the-fold）の画像もLazy Loadの対象になり、LCPが遅延していた。除去すればブラウザがビューポート内の画像を即座にロードし、ビューポート外は自動的に優先度を下げる。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/foundation/CoveredImage.tsx` | `loading="lazy"` 削除 |

## 期待効果

LCP改善（ファーストビュー画像の読み込み前倒し）
