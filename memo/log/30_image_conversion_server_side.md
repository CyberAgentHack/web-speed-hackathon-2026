# 30. 画像変換をサーバー側に移行 (2026-03-21)

## 変更内容

クライアントで行っていた TIFF→JPEG 変換をサーバー側の sharp に移行し、クライアントから `@imagemagick/magick-wasm`(14MB) と `piexifjs` を完全除去。

### Before

1. クライアント: 14MB WASM ダウンロード
2. クライアント: ImageMagick WASM で TIFF→JPEG 変換
3. クライアント: piexifjs で EXIF ImageDescription を再書き込み（変換時に消えるため）
4. クライアント: JPEG をアップロード
5. サーバー: JPEG→WebP 変換（sharp）、EXIF から alt 抽出

### After

1. クライアント: 生ファイルをそのままアップロード
2. サーバー: 任意形式→WebP 変換（sharp）、TIFF/JPEG から alt 抽出

## サイズ比較

| 項目 | Before | After |
|---|---|---|
| index.js（初期バンドル） | 723KB | **509KB (-214KB)** |
| magick.wasm | 14MB | **削除** |

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/routes/api/image.ts` | JPG限定→任意形式対応、TIFF の IFD から直接 alt 抽出を追加 |
| `client/src/components/new_post_modal/NewPostModalPage.tsx` | 画像変換処理を除去、生ファイルをそのままセット |
| `client/package.json` | `@imagemagick/magick-wasm`, `piexifjs`, `@types/piexifjs` 削除 |

## 削除した依存

- `@imagemagick/magick-wasm` (14MB WASM)
- `piexifjs` (EXIF 操作)
- `@types/piexifjs`
