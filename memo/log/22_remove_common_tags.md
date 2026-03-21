# 22. common-tags 削除 (2026-03-21)

## 変更内容

`common-tags` パッケージを削除。`stripIndents` の1箇所のみの使用を通常のテンプレートリテラルに置換。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/utils/create_translator.ts` | `stripIndents` → 通常テンプレートリテラル |
| `client/package.json` | `common-tags`, `@types/common-tags` 削除 |
