# Web Speed Hackathon 2026 — 最終レポート

## 最終スコア: 485.05 / 1150.00 (最終 50位 / 95名)

### リーダーボード上位

| 順位 | ユーザー名 | スコア |
|------|-----------|--------|
| 1位 | hmochizuki | 903.25 |
| 2位 | wwwyo | 866.45 |
| 3位 | otsuboa | 855.20 |
| 4位 | daku10 | 813.25 |
| 5位 | kq5y | 709.15 |
| ... | ... | ... |
| **50位** | **MasahitoKumada** | **485.05** |

- 参加者: 95名
- 1位との差: 418.20点
- 満点 (1150) に対する達成率: 42.2%

### スコア推移

| バージョン | 合計 | 順位 | 主な施策 |
|-----------|------|------|---------|
| ベースライン | 288.25 | - | チューニング前 |
| v1 | 240.60 | 58位 | webpack production mode, minify, tree-shaking |
| v2 | 229.55 | 100位 | bundle split + gzip compression |
| v3 | 397.95 | 83位 | jQuery除去, dynamic import, dayjs, native img, キャッシュ |
| **v4 (最終)** | **485.05** | **50位 (最終)** | Tailwind CSS ビルド時コンパイル |

---

## 実施した施策一覧

### v1: webpack ビルド最適化

| 変更 | 効果 |
|------|------|
| `mode: "production"` | デッドコード削除、変数名短縮 |
| `devtool: false` | inline source-map 除去 (~90MB) |
| `minimize: true` | TerserPlugin による圧縮 |
| `usedExports/sideEffects: true` | tree-shaking 有効化 |
| `NODE_ENV: "production"` | React 本番モード |
| Babel `modules: false` | ES modules 維持 → tree-shaking 有効 |
| Babel `targets: "defaults"` | IE11 向けトランスパイル除去 |

**結果**: main.js 108MB → 72MB

### v2: バンドル分割 + Backend 圧縮

| 変更 | 効果 |
|------|------|
| `splitChunks: { chunks: "all" }` | vendor chunk 分離 |
| `chunkFormat: "array-push"` | チャンク出力有効化 |
| WASM `asset/resource` | ffmpeg/magick WASM をバンドルから分離 |
| React.lazy | Crok, DM, NewPostModal の遅延ロード |
| `compression()` ミドルウェア | gzip レスポンス圧縮 |
| HtmlWebpackPlugin `inject: "head"` | チャンクの script タグ自動挿入 |

**結果**: 初期ロード 72MB → 6.65MB (gzip 2.3MB)

### v3: 本格パフォーマンスチューニング

| 変更 | 効果 |
|------|------|
| jQuery + `async: false` → fetch API | 同期 XHR 除去、メインスレッド解放 |
| `scriptLoading: "defer"` | HTML パースを JS 実行前に開始 |
| `@mlc-ai/web-llm` dynamic import | 5MB をオンデマンドロードに |
| negaposi-analyzer-ja dynamic import | 4.2MB 辞書をオンデマンドに |
| lodash → ネイティブ JS | SoundWaveSVG から lodash 除去 |
| core-js, regenerator-runtime 削除 | エントリポイント軽量化 |
| AudioContext ProvidePlugin 削除 | ネイティブ AudioContext 使用 |
| moment → dayjs | 60KB → 2KB (6ファイル) |
| CoveredImage → native `<img src>` | 同期 XHR + Blob URL → ネイティブ画像読み込み |
| Cache-Control, etag, lastModified | 静的ファイルキャッシュ有効化 |
| Connection: close 削除 | HTTP Keep-Alive 有効化 |

**結果**: 初期ロード 6.65MB → 570KB (gzip ~160KB), FCP 0.5秒

### v4: Tailwind CSS ビルド時コンパイル

| 変更 | 効果 |
|------|------|
| `@tailwindcss/browser` CDN script 削除 | ブラウザ内 CSS コンパイル排除 |
| `<style type="text/tailwindcss">` → index.css | ビルド時に CSS 生成 |
| `@tailwindcss/postcss` 追加 | PostCSS でビルド時コンパイル |

**結果**: FCP 全ページ 8-9点台、ユーザーフロー INP ほぼ満点

---

## 最終スコア詳細

### 通常テスト (436.55 / 900)

| テスト項目 | CLS (25) | FCP (10) | LCP (25) | SI (10) | TBT (30) | 合計 (100) |
|-----------|----------|----------|----------|---------|----------|------------|
| ホームを開く | 21.00 | 8.60 | 0.00 | 0.00 | 0.00 | 29.60 |
| 投稿詳細ページを開く | 25.00 | 9.20 | 5.75 | 9.60 | 0.60 | 50.15 |
| 写真つき投稿詳細ページを開く | 24.75 | 9.20 | 0.00 | 5.80 | 0.00 | 39.75 |
| 動画つき投稿詳細ページを開く | 23.50 | 9.00 | 14.75 | 3.40 | 0.00 | 50.65 |
| 音声つき投稿詳細ページを開く | 25.00 | 9.20 | 5.25 | 8.90 | 0.00 | 48.35 |
| 検索ページを開く | 25.00 | 9.20 | 16.25 | 9.80 | 0.90 | 61.15 |
| DM一覧ページを開く | 25.00 | 9.10 | 14.50 | 6.30 | 6.30 | 61.20 |
| DM詳細ページを開く | 25.00 | 9.20 | 8.25 | 1.40 | 0.00 | 43.85 |
| 利用規約ページを開く | 25.00 | 9.00 | 8.25 | 7.50 | 2.10 | 51.85 |

### ユーザーフローテスト (48.50 / 250)

| テスト項目 | INP (25) | TBT (25) | 合計 (50) |
|-----------|----------|----------|-----------|
| ユーザー登録 → サインアウト → サインイン | - | - | 計測不可 |
| DM送信 | - | - | 計測不可 |
| 検索 → 結果表示 | - | - | 計測不可 |
| Crok AIチャット | 23.75 | 0.00 | 23.75 |
| 投稿 | 24.75 | 0.00 | 24.75 |

---

## 失点分析

| 指標 | 獲得 | 満点 | 失点 | 失点原因 |
|------|------|------|------|---------|
| **TBT (通常)** | 9.90 | 270 | **260.10** | vendor chunk (269.js) の Script Evaluation 17秒 |
| **LCP** | 73.00 | 225 | **152.00** | GIF 25MB, 画像 6.7MB の巨大転送 |
| **SI** | 52.70 | 90 | **37.30** | GIF 読み込み待ち |
| **ユーザーフロー** | 48.50 | 250 | **201.50** | 3/5 計測不可 (TBT + fly.io 不安定) |
| **FCP** | 82.70 | 90 | 7.30 | ほぼ満点 |
| **CLS** | 219.25 | 225 | 5.75 | ほぼ満点 |

**TBT とメディア最適化 (GIF/画像) が残りの失点の 85%** を占める。

---

## 未実施の施策と Next Action

### Priority 1: TBT 改善 (推定 +150-200点)

| 施策 | 効果 | 難度 |
|------|------|------|
| GIF → MP4/WebM 変換 | GIF の JS デコード (gifler/omggif) を排除、メインスレッド解放 | 中 |
| PausableMovie の lazy load | gifler/omggif をオンデマンドロード | 低 |
| vendor chunk のさらなる分割 | react-dom, redux 等を個別チャンクに | 低 |
| Web Worker で音声デコード | SoundWaveSVG の AudioContext.decodeAudioData をオフロード | 中 |

### Priority 2: LCP/SI 改善 (推定 +100-150点)

| 施策 | 効果 | 難度 |
|------|------|------|
| 画像圧縮・フォーマット変換 | JPEG 6.7MB → WebP/AVIF 100-500KB | 中 |
| GIF → MP4/WebM (上記と同じ) | 25MB → 1-3MB | 中 |
| `loading="lazy"` | ビューポート外の画像を遅延読み込み | 低 |
| 画像サイズのレスポンシブ化 | srcset で適切なサイズを配信 | 中 |

### Priority 3: ユーザーフロー安定化 (推定 +50-75点)

| 施策 | 効果 | 難度 |
|------|------|------|
| TBT 改善 (上記) | 操作可能になるまでの時間を短縮 | - |
| sendJSON の小ペイロード圧縮スキップ | CompressionStream の非同期コストを削減 | 低 |
| サーバーサイドページネーション | `use_infinite_fetch` の全件取得を排除 | 中 |

### Priority 4: その他の最適化

| 施策 | 効果 | 難度 |
|------|------|------|
| OTF フォント → WOFF2 サブセット | 12.6MB → 200KB 以下 | 低 |
| `font-display: swap` | フォント読み込み中もテキスト表示 | 低 |
| 検索 API の UNION クエリ化 | API レスポンス高速化 | 低 |
| HTTP/2 対応 | 並列リクエスト効率化 | 中 |

---

## 学び

### 技術的な学び

1. **「何を読み込まないか」が最重要** — 108MB → 570KB の削減は minify ではなく、不要モジュール (WASM, web-llm, kuromoji, jQuery 等) の除外が決め手
2. **同期処理は TBT の敵** — jQuery の `async: false` がメインスレッドを完全ブロックし、TBT を壊滅させていた
3. **ブラウザランタイムは高コスト** — Tailwind CSS のブラウザ内コンパイルは FCP/TBT に直撃。ビルド時処理に移すだけで大幅改善
4. **dev 環境と local の差** — ローカルで問題なくても fly.io の低スペック VM で顕在化する問題が多い
5. **GIF は現代 Web の敵** — 25MB の GIF は MP4 なら 1-3MB。フォーマット変換だけで LCP が劇的改善する

### プロセスの学び

1. **計測 → 分析 → 施策 → 検証のサイクル** が重要。感覚ではなくデータで判断
2. **VRT で機能を守りながら攻める** — レギュレーション違反を防ぎつつパフォーマンス改善
3. **段階的な改善** — 一度に全部やらず、v1→v2→v3→v4 と段階的に進めることで問題の切り分けが容易
4. **Lighthouse スコアの配点理解** — TBT 30%, LCP 25%, CLS 25% の配分を理解して優先度を決定

---

## 関連リソース

- PR: https://github.com/CyberAgentHack/web-speed-hackathon-2026/pull/251
- スコアリング Issue: https://github.com/CyberAgentHack/web-speed-hackathon-2026-scoring/issues/195
- デプロイ URL: https://pr-251-web-speed-hackathon-2026.fly.dev/
- 計測結果: `performance/scoring_tool/`, `performance/lighthouse/`
- VRT 結果: `regression/`
- プラン: `plans/`
