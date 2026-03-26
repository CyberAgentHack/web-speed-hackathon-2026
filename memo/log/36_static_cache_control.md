# 36. 静的ファイルにCache-Control追加 (2026-03-21)

## 変更内容

upload/public/distの静的ファイルに `maxAge: "1d"` を追加。

## 理由

etagのみでmax-ageがなかったため、ブラウザが毎回304 revalidationリクエストを送っていた。画像・音声・動画・フォント等は頻繁に変更されないため、1日のキャッシュで十分。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/routes/static.ts` | UPLOAD_PATH, PUBLIC_PATH, CLIENT_DIST_PATH に `maxAge: "1d"` 追加 |

## 計測

未計測
