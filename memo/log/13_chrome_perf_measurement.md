# 13. Chrome パフォーマンス計測 (2026-03-20)

## 計測環境
- URL: https://pr-43-web-speed-hackathon-2026.fly.dev/
- 計測方法: Chrome Performance API (トップページ)

## Core Metrics

| 指標 | 値 |
|---|---|
| First Paint | 1,044ms |
| First Contentful Paint (FCP) | 1,560ms |
| DOM Interactive | 524ms |
| DOM Content Loaded | 1,215ms |
| Load Event | 1,310ms |
| CLS | 0.0000 |

## リソース転送量（トップページ）

| カテゴリ | 件数 | 合計サイズ |
|---|---|---|
| fetch (GIF/MP3) | 13件 | ~90MB |
| img (JPEG) | 28件 | ~37MB |
| script (JS) | 5件 | 253KB |
| **合計** | — | **~130MB** |

## 致命的に大きなリソース

| リソース | サイズ | 備考 |
|---|---|---|
| GIF (51a14d70) | 25.6MB | fetch→omggif→Canvas描画 |
| GIF (b44e6ef6) | 17.7MB | 同上 |
| GIF (1b558288) | 13.5MB | 同上 |
| GIF (3cb50e48) | 10.8MB | 同上 |
| MP3 (5d0cd8a0) | 8.8MB | fetch→ArrayBuffer→Blob URL |
| GIF (7518b1ae) | 8.4MB | 同上 |
| JPEG (85946f86) | 6.8MB | 3549x5323→245x277表示 |
| フォント (OTF×2) | 12.7MB | font-display:block で描画ブロック |

## 現状の問題分析

### 1. GIF (~76MB)
- `PausableMovie.tsx` で `fetch()` → `omggif` でJSデコード → Canvas描画
- ブラウザのハードウェアデコードが使えない
- 全バイナリをダウンロード完了するまで何も表示されない

### 2. 画像 (~37MB)
- 元サイズのまま配信（リサイズ・圧縮なし）
- WebP/AVIF 未使用、srcset/picture 未使用
- 60枚中30枚が loading="auto"（eager扱い）

### 3. フォント (12.7MB)
- OTF形式のみ（woff2サブセットなし）
- `font-display: block` でFCP完全ブロック
- preload なし
- ※過去に swap/woff2 変換を試みたがVRT失敗で断念 (log 08)

### 4. MP3 (~16MB)
- `SoundPlayer.tsx` で `fetch()` → ArrayBuffer → Blob URL → `<audio>`
- ブラウザの Range Request / ストリーミング再生を活用していない
- 同じデータを波形描画用に `decodeAudioData` でも処理（メモリ二重保持）

### 5. その他
- preload / preconnect なし
- Brotli 未使用（gzipのみ）
- index.js (722KB) に pako, classnames, fast-average-color 等含む
- SearchContainer (4.3MB) に kuromoji + redux-form 同梱

## 改善案（優先順位順）

| # | 改善内容 | 想定効果 |
|---|---|---|
| 1 | 画像最適化 (sharp: リサイズ + WebP変換) | 37MB → 数百KB |
| 2 | GIF → MP4/WebM 変換 + `<video>` タグ | 76MB → 数MB |
| 3 | フォント最適化 (woff2サブセット + swap + size-adjust) | 12.7MB → 数百KB |
| 4 | MP3 ストリーミング (`<audio src=...>` 直接, preload="none") | 初期ロードから ~16MB 削減 |
| 5 | 全画像に loading="lazy" + srcset/picture | 初期転送量削減 |
| 6 | JS バンドル最適化 (不要ライブラリ軽量化) | 数百KB削減 |
| 7 | preload/preconnect 追加 | FCP改善 |
| 8 | Brotli 圧縮導入 | テキストリソース 15-20% 削減 |

## 前回スコアとの比較
- 前回計測 (log 04): 339.70 / 1150 pts
- log 05〜12 は未計測のため、現在の正確なスコアは不明
- 画像・GIF・フォントの3点だけで ~120MB → 数MB に削減可能と推定
