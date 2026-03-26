# 23. 翻訳機能を Chrome Translator API に移行 (2026-03-21)

## 変更内容

ブラウザ内LLM（`@mlc-ai/web-llm`）による翻訳を Chrome 組み込みの Translator API に置換。

### 削除した依存

| パッケージ | サイズ | 理由 |
|---|---|---|
| `@mlc-ai/web-llm` | 13MB | Translator API で代替 |
| `langs` | 76KB | 言語コード変換不要に |
| `json-repair-js` | 48KB | LLM応答パース不要に |
| `tiny-invariant` | - | 他に使用箇所なし |
| `@types/langs` | - | 型定義 |

### 追加した依存

| パッケージ | 理由 |
|---|---|
| `@types/dom-chromium-ai` | Translator API の型定義（devDependencies） |

## サイズ比較

| チャンク | Before | After |
|---|---|---|
| create_translator | 5.3MB | **238B** |

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/utils/create_translator.ts` | `@mlc-ai/web-llm` → `Translator.create()` に全面書き換え |
| `client/package.json` | 4依存削除、`@types/dom-chromium-ai` 追加 |
