# 35. negaposi辞書のdynamic import化 (2026-03-21)

## 変更内容

`SearchPage.tsx` の `analyzeSentiment` を静的importからdynamic import (`import()`) に変更。

## 理由

`negaposi-analyzer-ja` の4.3MB JSON辞書がSearchContainerのチャンクにバンドルされていた。感情分析は検索実行時にのみ必要なため、遅延ロードで十分。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/application/SearchPage.tsx` | 静的import → dynamic import |

## バンドルサイズ

- SearchContainer: 4.3MB → **4.9KB**
- negaposi辞書は別チャンク（4.3MB）として検索時にのみロード

## 計測

未計測
