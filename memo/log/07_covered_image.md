# CoveredImage: 画像表示の最適化

## 変更内容

### CoveredImage.tsx
- `fetchBinary` + Blob URL 変換を削除 → `<img src={src}>` で直接表示
- `image-size` (sizeOf) によるバイナリサイズ計算を削除 → `object-fit: cover` で CSS に任せる
- `piexifjs` による EXIF alt 抽出を完全削除 → API レスポンスの `image.alt` を props で受け取る
- `loading="lazy"` 追加でビューポート外の画像を遅延ロード
- 不要な依存を削除: `image-size`, `piexifjs`, `classnames`, `useFetch`, `fetchBinary`

### ImageArea.tsx
- `image.alt` を CoveredImage に props として渡すよう変更

### seeds.ts
- Image seed 投入時に画像ファイルから EXIF ImageDescription を抽出して `alt` フィールドに保存
- jsonl は変更せず、seed 投入スクリプト内で動的に取得

### database.sqlite
- `seed:insert` で再生成（alt 入り）

## 影響
- 画像がブラウザのネイティブ `<img>` ロードで表示され、キャッシュ・プリフェッチ・プログレッシブ描画が有効に
- 画像の2重フェッチ（`<img>` + piexifjs の `fetch`）が解消
- バンドルから `image-size`, `piexifjs` が完全に除外
- `POST /api/v1/initialize` 後も alt が正しく保持されることを確認済み

## VRT 結果

未計測

## 計測結果

未計測
