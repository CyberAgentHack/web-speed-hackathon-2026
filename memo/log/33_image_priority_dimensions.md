# 33. 画像のfetchpriority・width/height・lazy loading追加 (2026-03-21)

## 変更内容

- タイムライン最初の2件の投稿画像に `fetchPriority="high"` を設定（LCP改善）
- それ以外の投稿画像に `loading="lazy"` を設定（リソース競合削減）
- プロフィール画像に `width={64} height={64}` を追加（CLS防止）

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/timeline/Timeline.tsx` | 最初の2件に `priority={true}` を渡す |
| `client/src/components/timeline/TimelineItem.tsx` | `priority` prop追加、プロフィール画像に width/height 追加 |
| `client/src/components/post/ImageArea.tsx` | `priority` を `CoveredImage` に伝播 |
| `client/src/components/foundation/CoveredImage.tsx` | `fetchPriority="high"` / `loading="lazy"` 追加 |
| `client/src/components/post/PostItem.tsx` | プロフィール画像に width/height 追加 |

## 計測

未計測
