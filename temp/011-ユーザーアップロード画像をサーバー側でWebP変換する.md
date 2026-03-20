# 011-ユーザーアップロード画像をサーバー側でWebP変換する

## 概要
現状クライアント側でImageMagick WASMを使ってJPG変換しているのを、サーバー側でWebP変換に変更する。
クライアントのバンドルからImageMagick WASMを除去でき、TBT改善にも寄与。

## 方針
- WebPを選択する理由: エンコードが高速、リアルタイム変換でINP/TBTへの影響を抑える
- サーバー側でsharp等を使ってWebP変換
- クライアント側のImageMagick WASM依存を除去

## 変更が必要な箇所
- `application/server/src/routes/api/image.ts` — アップロード時にWebP変換
- `application/client/src/utils/convert_image.ts` — ImageMagick WASM変換を除去、生ファイルをそのまま送信
- サーバーのpackage.jsonにsharp追加
- クライアントのpackage.jsonからImageMagick WASM関連を除去

## 注意事項
- 採点シナリオ「投稿」でメディア付き投稿があるため、変換速度がINPに影響しうる
- VRTが失敗しないこと
