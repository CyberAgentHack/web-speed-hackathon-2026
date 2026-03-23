---
name: bundle-analyze
description: Webpack ビルド出力のチャンクサイズ、重量級依存、コード分割の状態を分析する。「バンドルが大きい」「何が重い？」「TBT の原因は？」「tree shaking 効いてる？」といった場面で使う。スコア計測には perf-measure、改善提案には perf-propose を使うこと。
---

# バンドル分析スキル

## 前提条件

- `cd application && pnpm run build` が成功済みで `application/dist/` が存在すること
- 存在しない場合はユーザーにビルドを依頼する

## ワークフロー

### Step 1: ビルド出力の確認

```bash
# JS チャンク
find application/dist/scripts -name '*.js' -exec ls -la {} + 2>/dev/null | sort -k5 -rn

# CSS
find application/dist/styles -name '*.css' -exec ls -la {} + 2>/dev/null

# 総サイズ
du -sh application/dist/
```

### Step 2: バンドル内容の分析

```bash
# webpack-bundle-analyzer があれば使う
# なければバンドルファイルを直接検査

# 重い依存がバンドルに含まれているか確認
for dep in core-js regenerator jquery lodash moment bluebird ffmpeg imagemagick magick-wasm web-llm kuromoji negaposi bayesian-bm25 standardized-audio katex react-syntax-highlighter; do
  count=$(grep -c "$dep" application/dist/scripts/main.js 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    echo "FOUND: $dep ($count refs)"
  fi
done
```

### Step 3: Webpack 設定の確認

`application/client/webpack.config.js` の最適化状態:

| 設定 | 現在値 | 推奨値 | 影響 |
|------|--------|--------|------|
| `mode` | `"none"` | `"production"` | ミニファイ、tree-shaking 有効化 |
| `optimization.minimize` | `false` | `true` | JS 圧縮 |
| `optimization.splitChunks` | `false` | `{ chunks: 'all' }` | コード分割 |
| `optimization.concatenateModules` | `false` | `true` | モジュール結合 |
| `optimization.usedExports` | `false` | `true` | tree-shaking |
| `optimization.sideEffects` | `false` | `true` | 副作用分析 |
| `cache` | `false` | `true` | ビルドキャッシュ |
| `devtool` | `"inline-source-map"` | `false` or `"source-map"` | バンドルサイズ半減 |

### Step 4: ユーザーへの報告

以下の形式で要約する:

```markdown
| チャンク | サイズ (KB) | gzip (KB) | 問題 |
|---------|-----------|-----------|------|
```

上位 3 件のアクション可能な発見を箇条書きで報告する。改善施策が必要なら perf-propose へ案内する。

## このプロジェクトの重い依存（検出対象）

初期状態でバンドルに含まれている重量級ライブラリ:

| ライブラリ | サイズ目安 | 用途 | 初期ロードに必要か |
|-----------|----------|------|------------------|
| core-js | ~200 KB | Polyfill (IE 11 向け) | 不要 |
| regenerator-runtime | ~20 KB | Generator polyfill | 不要 |
| jQuery + jquery-binarytransport | ~90 KB | HTTP リクエスト | fetch API で代替可能 |
| lodash | ~70 KB | Utility | ネイティブで代替可能 |
| moment | ~300 KB | 日時処理 | Date API / date-fns で代替可能 |
| bluebird | ~50 KB | Promise ライブラリ | ネイティブ Promise で十分 |
| @ffmpeg/ffmpeg + @ffmpeg/core | ~数 MB | 動画エンコード WASM | 投稿時のみ必要 |
| @imagemagick/magick-wasm | ~数 MB | 画像処理 WASM | 投稿時のみ必要 |
| @mlc-ai/web-llm | ~大 | ブラウザ LLM | /crok ページのみ必要 |
| kuromoji | ~辞書 17 MB | 形態素解析 | /search ページのみ必要 |
| react-syntax-highlighter | ~1 MB+ | コードハイライト | /crok ページのみ必要 |
| katex + rehype-katex | ~300 KB | 数式レンダリング | /crok ページのみ必要 |
| standardized-audio-context | ~50 KB | Web Audio polyfill | 音声再生時のみ必要 |

## バンドル混入パターン

| パターン | 症状 | 確認方法 |
|---------|------|---------|
| Webpack entry に丸ごと含む | 全ページで全依存をロード | `webpack.config.js` の `entry` を確認 |
| splitChunks: false | コード分割なし | `optimization.splitChunks` |
| 動的 import 未使用 | ルート別分割されていない | `import()` の有無を確認 |
| Tailwind CDN | 実行時コンパイル | `index.html` の `<script>` タグ |

## Quick Reference

| 項目 | 値 |
|------|-----|
| ビルド出力 | `application/dist/` |
| JS 出力 | `application/dist/scripts/` |
| CSS 出力 | `application/dist/styles/` |
| Webpack 設定 | `application/client/webpack.config.js` |
| Babel 設定 | `application/client/babel.config.js` |
| TBT 配点 | 30 点（単一メトリクス最大） |
