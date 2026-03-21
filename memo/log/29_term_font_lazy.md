# 29. 利用規約ページ専用フォントの遅延読み込み (2026-03-21)

## 変更内容

`Rei no Are Mincho` フォント（Regular 343KB + Heavy 326KB = 約669KB）の `@font-face` 定義を `index.css`（グローバル）から `TermPage` コンポーネント専用の CSS に分離。

## 理由

このフォントは利用規約ページ（`TermPage.tsx`）の見出しでしか使われていない。グローバル CSS に `@font-face` があると、Vite のバンドルに含まれ、利用規約ページ以外でも CSS パース対象になる。`TermPage` が lazy load されるルートであれば、CSS も一緒に遅延読み込みされるようになり、他ページの初期ロードに影響しなくなる。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/index.css` | `@font-face` 定義2つを削除 |
| `client/src/components/term/term-font.css` | 新規作成、フォント定義を移動 |
| `client/src/components/term/TermPage.tsx` | `import './term-font.css'` 追加 |

## 計測

未計測
