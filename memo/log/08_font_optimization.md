# フォント最適化: font-display swap + woff2 変換

## 変更内容

### index.css
- `font-display: block` → `swap` に変更（Regular, Heavy 両方）
  - フォント読み込み中もシステムフォントでテキスト即表示
- フォント参照を `.otf` → `.woff2` に変更

### public/fonts/
- wawoff2 (npm) で OTF → woff2 に変換
  - Regular: 6.3MB → 3.6MB (42%削減)
  - Heavy: 6.4MB → 3.7MB (42%削減)
- 不要になった otf ファイルを削除

## 影響
- `font-display: swap` でテキスト描画ブロックが解消 → FCP 改善
- woff2 でフォント転送量が合計 12.7MB → 7.5MB に削減
- さらに gzip 転送でもう一段圧縮される

## VRT 結果

未計測

## 計測結果

未計測
