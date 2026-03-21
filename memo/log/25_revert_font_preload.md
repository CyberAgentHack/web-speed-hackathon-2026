# 25. フォント preload 削除 (2026-03-21)

## 変更内容

log 20 で追加した `<link rel="preload">` を削除。計測でスコアが下がったため。

## 原因

`font-display: swap` のフォントはレンダリングをブロックしない（フォールバックフォントで即表示される）。preload でフォント(669KB)のダウンロードを前倒しすると、CSS・JS など本当にクリティカルなリソースと帯域を奪い合い、FCP/LCP が悪化する。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/index.html` | `<link rel="preload" as="font">` 2行を削除 |
