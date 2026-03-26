# 40. 画像投稿VRT修正

## 変更内容

### 1. NewPostModalContainer.tsx - toggleハンドラ修正（別プロセスでコミット済み）
- `closedby="any"` による light dismiss が `setInputFiles()` 時に発火し、コンポーネントが再マウントされてフォームstateがリセットされていた
- toggleハンドラをダイアログが閉じた時（`!element.open`）のみリセットするように変更

### 2. post.ts - 画像投稿API修正
- `83c34cd`（画像変換をAPI側に寄せる）で `/api/v1/images` に `Image.create()` が追加されたが、`POST /posts` の `Post.create` も `include: [{ association: "images" }]` で同じIDのImageを再INSERTしようとしていた
- Sequelize ユニーク制約違反 → ValidationError → 400 Bad Request
- 修正: `Post.create` の include から images を外し、`post.setImages(imageIds)` で既存レコードを関連付け

## VRT結果
- 修正前: 1 failed (`画像の投稿ができる`), 1-2 flaky
- 修正後: 51 passed, 0 failed, 0 flaky

## レギュレーション確認
- fly.toml: 未変更
- VRT: 全通過
- SSE: 未変更
- POST /api/v1/initialize: 正常動作
