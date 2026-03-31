# Web Speed Hackathon 2026 - パフォーマンス問題一覧（優先順）

## 🔴 最優先（巨大なインパクト）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 5 | **WASM巨大バイナリ** | `client/package.json` | FFmpeg(6.3MB), ImageMagick(3.2MB), kuromoji(10MB+) → サーバーサイド処理 or 削除 |

## 🟠 高優先（Core Web Vitals直撃）

## 🟡 中優先（表示速度・UX改善）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 12 | **画像の同期DL+毎描画EXIF解析** | `client/src/components/foundation/CoveredImage.tsx` | バイナリDL→sizeOf→EXIF解析を毎レンダーで実行 → `<img>` タグ直接使用 |
→直したけど、見た目変わった
| 13 | **動画/音声のバイナリ全DL** | `PausableMovie.tsx`, `SoundPlayer.tsx` | 同期XHRで全DL → `<video>`/`<audio>` のsrc直接指定 |

## 🟢 低優先（仕上げ）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 16 | **サーバーN+1クエリ** | `server/src/models/Post.ts`, `api/search.ts` | defaultScopeの過剰JOIN、検索の重複クエリ |
| 20 | **サーバーfs.readFileSync** | `server/src/routes/api/crok.ts` | 起動時の同期ファイル読み込み |

## 推奨戦略

1. **#1〜#5 を先に対応** → バンドルサイズとTBT(Total Blocking Time)が劇的に改善
2. **#6〜#10 でキャッシュ・CWV改善**
3. **残りは余裕があれば対応**
