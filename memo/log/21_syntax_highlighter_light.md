# 21. react-syntax-highlighter 軽量化 (2026-03-21)

## 変更内容

`react-syntax-highlighter` のデフォルトインポート（全190+言語）を light ビルド + 必要言語のみ登録に切り替え。

### 登録言語（crok-response.md で使用される6言語）

bash, json, python, rust, sql, typescript

### 削除した言語

css, go, java, javascript, ruby, xml, yaml, html, shell 他180+言語

## サイズ比較

| 段階 | raw | gzip |
|---|---|---|
| Before（全言語） | 1.3MB | 407KB |
| **After（6言語）** | **489KB** | **151KB** |
| **削減** | **-811KB** | **-256KB** |

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/crok/CodeBlock.tsx` | light.js インポートに変更、6言語のみ登録 |
| `client/package.json` | 不要な `image-size` 依存を削除 |
