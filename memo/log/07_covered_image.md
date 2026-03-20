# CoveredImage: 画像表示の最適化

## 変更内容

### CoveredImage.tsx
- `fetchBinary` + Blob URL 変換を削除 → `<img src={src}>` で直接表示
- `image-size` (sizeOf) によるバイナリサイズ計算を削除 → `object-fit: cover` で CSS に任せる
- `piexifjs` による EXIF alt 抽出を dynamic import で非同期化（画像表示をブロックしない）
- `loading="lazy"` 追加でビューポート外の画像を遅延ロード
- 不要な依存を削除: `image-size`, `classnames`, `useFetch`, `fetchBinary`

### ImageArea.tsx
- 変更なし（DB の alt は空文字のため props 経由での受け渡しは不要）

## 影響
- 画像がブラウザのネイティブ `<img>` ロードで表示されるようになり、キャッシュ・プリフェッチ・プログレッシブ描画が有効に
- メインスレッドでの image-size 計算・EXIF 解析のブロッキングが解消
- バンドルから `image-size` が除外、`piexifjs` は遅延ロードに

## VRT 結果

未計測

## 計測結果

未計測
