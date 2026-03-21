# 20. フォント preload ヒント追加 (2026-03-21)

## 変更内容

`index.html` に `<link rel="preload">` を追加し、フォントのダウンロード開始タイミングを前倒し。

### Before

HTML → JS → CSS → `@font-face` 発見 → フォントダウンロード開始（3段のウォーターフォール）

### After

HTML パース時点で即座にフォントダウンロード開始（ウォーターフォール解消）

## 対象フォント

| ファイル | サイズ |
|---|---|
| ReiNoAreMincho-Regular.woff2 | 343KB |
| ReiNoAreMincho-Heavy.woff2 | 326KB |

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/index.html` | `<link rel="preload" as="font">` を2行追加 |

## 期待効果

- FCP/LCP -100〜200ms（フォント発見までのウォーターフォール解消）
- FOUT 時間の短縮（`font-display: swap` のフォールバック表示時間が減少）
