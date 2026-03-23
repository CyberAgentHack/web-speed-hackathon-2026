---
name: dependency-prune
description: package.json の不要な依存、バンドルに混入した重いライブラリ、バレル import、不要 polyfill を機械的に洗い出す。「不要な依存を探して」「使ってないライブラリある？」「import * を探して」「polyfill 必要？」「バンドル減らしたい」といった場面で使う。チャンクの分割状態には bundle-analyze を使うこと。
---

# 依存関係プルーニングスキル

## 前提条件

- ソースコードが読める状態であること
- TBT（配点 30 点）の改善に直結する

## ワークフロー

### Step 1: 未使用依存の検出

```bash
for dep in $(node -e "console.log(Object.keys(require('./application/client/package.json').dependencies || {}).join('\n'))"); do
  count=$(grep -r "from ['\"]${dep}" application/client/src/ 2>/dev/null | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "UNUSED: $dep"
  fi
done
```

同様に `application/server/` にも実行。

### Step 2: 重量級ライブラリの検出

| ライブラリ | サイズ目安 | 確認コマンド |
|-----------|----------|------------|
| @ffmpeg/ffmpeg + core | ~数 MB | `grep -r "ffmpeg" application/client/src/` |
| @imagemagick/magick-wasm | ~数 MB | `grep -r "magick-wasm\|imagemagick" application/client/src/` |
| @mlc-ai/web-llm | ~大 | `grep -r "web-llm\|mlc-ai" application/client/src/` |
| kuromoji | ~辞書 17 MB | `grep -r "kuromoji" application/client/src/` |
| jQuery | ~90 KB | `grep -r "jquery\|\\$\\.ajax\|\\$\\.get\|\\$\\.post" application/client/src/` |
| lodash | ~70 KB | `grep -r "from 'lodash'" application/client/src/` |
| moment | ~300 KB | `grep -r "from 'moment'" application/client/src/` |
| bluebird | ~50 KB | `grep -r "from 'bluebird'" application/client/src/` |
| core-js | ~200 KB | Webpack entry で直接含まれている |
| regenerator-runtime | ~20 KB | Webpack entry で直接含まれている |
| react-syntax-highlighter | ~1 MB+ | `grep -r "react-syntax-highlighter" application/client/src/` |
| katex | ~300 KB | `grep -r "katex\|rehype-katex" application/client/src/` |
| standardized-audio-context | ~50 KB | `grep -r "standardized-audio-context" application/client/src/` |

### Step 3: 問題のある import パターンの検出

```bash
# ワイルドカード import（tree shaking 無効化リスク）
grep -rn "import \* as" application/client/src/ --include="*.ts" --include="*.tsx"

# バレル import（index.ts からの re-export）
grep -rn "from '\.\./index'" application/client/src/ --include="*.ts" --include="*.tsx"
```

### Step 4: Webpack entry の見直し

`application/client/webpack.config.js` の entry:

```js
entry: {
  main: [
    "core-js",                    // ← 不要（モダンブラウザには不要）
    "regenerator-runtime/runtime", // ← 不要
    "jquery-binarytransport",     // ← jQuery 依存ごと除去可能
    "index.css",
    "buildinfo.ts",
    "index.tsx",
  ],
},
```

また ProvidePlugin でグローバル注入されているもの:

```js
new webpack.ProvidePlugin({
  $: "jquery",                // ← jQuery 置換時に除去
  AudioContext: [...],        // ← standardized-audio-context
  Buffer: ["buffer", "Buffer"], // ← 必要な箇所だけ import
  "window.jQuery": "jquery",  // ← jQuery 置換時に除去
}),
```

### Step 5: 遅延ロード候補の特定

| ライブラリ | 使用ページ/機能 | 遅延ロード方法 |
|-----------|---------------|---------------|
| @ffmpeg/ffmpeg | 投稿（動画） | `import()` で投稿時に読み込み |
| @imagemagick/magick-wasm | 投稿（画像） | `import()` で投稿時に読み込み |
| @mlc-ai/web-llm | /crok (翻訳) | `import()` で Crok ページのみ |
| kuromoji | /search | `import()` で検索時に読み込み |
| negaposi-analyzer-ja | /search | `import()` で検索時に読み込み |
| react-syntax-highlighter | /crok | `import()` で Crok ページのみ |
| katex / rehype-katex | /crok | `import()` で Crok ページのみ |
| bayesian-bm25 | /search | `import()` で検索時に読み込み |

### Step 6: レポート出力

```markdown
# 依存関係プルーニングレポート

**分析日**: YYYY-MM-DD

## 未使用依存
| パッケージ | ワークスペース | アクション |

## 重量級ライブラリ
| パッケージ | サイズ | 使用箇所 | 代替案 / 遅延ロード |

## 問題のある import
| ファイル | パターン | 影響 |

## Webpack entry の不要エントリ
| エントリ | 理由 | アクション |

## 推奨アクション（優先順）
1. ...
```

## Quick Reference

| 項目 | 値 |
|------|-----|
| Client package.json | `application/client/package.json` |
| Server package.json | `application/server/package.json` |
| Webpack config | `application/client/webpack.config.js` |
| Babel config | `application/client/babel.config.js` |
| 公開辞書 | `application/public/dicts/` (17 MB) |
