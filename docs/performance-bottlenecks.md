# Web Speed Hackathon 2026 - パフォーマンス問題一覧（優先順）

## 🔴 最優先（巨大なインパクト）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 4 | **巨大ライブラリ群** | `client/package.json` | jQuery(83KB), moment(67KB), lodash(72KB), bluebird(81KB) 等の削除/軽量化 |
| 5 | **WASM巨大バイナリ** | `client/package.json` | FFmpeg(6.3MB), ImageMagick(3.2MB), kuromoji(10MB+) → サーバーサイド処理 or 削除 |

## 🟠 高優先（Core Web Vitals直撃）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 6 | **キャッシュ無効化** | `server/src/app.ts` | `Cache-Control: max-age=0` + `etag: false` → 適切なキャッシュヘッダー設定 |
| 7 | **コード分割なし** | Webpack設定全体 | `React.lazy()` / dynamic importによるルート分割が皆無 |
| 9 | **1msポーリング（scheduler.postTask）** | `client/src/hooks/use_search_params.ts`, `use_has_content_below.ts` | 1ms間隔の `user-blocking` 優先タスク → イベント駆動に変更 |
| 10 | **1ms setInterval** | `client/src/components/direct_message/DirectMessagePage.tsx` | DM画面で毎ms `getComputedStyle` + `scrollTo` → MutationObserver等に変更 |

## 🟡 中優先（表示速度・UX改善）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 12 | **画像の同期DL+毎描画EXIF解析** | `client/src/components/foundation/CoveredImage.tsx` | バイナリDL→sizeOf→EXIF解析を毎レンダーで実行 → `<img>` タグ直接使用 |
| 13 | **動画/音声のバイナリ全DL** | `PausableMovie.tsx`, `SoundPlayer.tsx` | 同期XHRで全DL → `<video>`/`<audio>` のsrc直接指定 |
| 14 | **音声解析のAudioContext乱立** | `SoundWaveSVG.tsx` | 毎マウントでAudioContext生成 + lodash重処理 |
| 15 | **Webpack sideEffects: true** | `client/webpack.config.js` | Tree-shakingが無効化 → `false` に変更 |

## 🟢 低優先（仕上げ）

| # | 問題 | ファイル | 内容 |
|---|------|----------|------|
| 16 | **サーバーN+1クエリ** | `server/src/models/Post.ts`, `api/search.ts` | defaultScopeの過剰JOIN、検索の重複クエリ |
| 17 | **画像lazy loading未実装** | TimelineItem等 | `loading="lazy"` なし、Intersection Observer なし |
| 18 | **レイアウトスラッシング** | `AspectRatioBox.tsx` | resize毎にスロットルなし再計算 |
| 19 | **メモ化なし** | Timeline系コンポーネント | `React.memo` / `useMemo` / `useCallback` 未使用で不要再レンダー多発 |
| 20 | **サーバーfs.readFileSync** | `server/src/routes/api/crok.ts` | 起動時の同期ファイル読み込み |

## 推奨戦略

1. **#1〜#5 を先に対応** → バンドルサイズとTBT(Total Blocking Time)が劇的に改善
2. **#6〜#10 でキャッシュ・CWV改善**
3. **残りは余裕があれば対応**
