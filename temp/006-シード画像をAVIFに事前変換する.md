# 006-シード画像をAVIFに事前変換する

## 概要
`application/public/images/` のシード画像（投稿画像30枚+プロフィール画像30枚）をAVIFに事前変換する。
現状合計89MB。AVIF化で大幅に削減可能。

## 方針
- シード画像は事前変換（ビルド時ではなくリポジトリにコミット）
- AVIFを選択する理由: 時間制約なし、WebPより30-50%高圧縮、Chrome最新版のみ対応すればよい
- 品質はVRTが通るレベルを維持（高めに設定して調整）

## 対象ファイル
- `application/public/images/*.jpg` — 投稿画像30枚（最大6.7MB/枚）
- `application/public/images/profiles/*.jpg` — プロフィール画像30枚（最大264KB/枚）

## 変更が必要な箇所
- 画像ファイル自体の変換（.jpg → .avif）
- サーバー側の画像配信パス・Content-Type対応
- クライアント側の画像参照（拡張子変更）
- シードデータ（seeds/images.jsonl 等でファイル名を参照している場合）
- CoveredImage コンポーネント

## 注意事項
- VRTが失敗しないこと（品質設定の調整が必要になる可能性あり）
- シードの各種IDは変更禁止
