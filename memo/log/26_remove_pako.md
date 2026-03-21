# 26. pako 除去 → CompressionStream API (2026-03-21)

## 変更内容

gzip圧縮ライブラリ `pako` をブラウザネイティブの `CompressionStream` API に置き換え、完全除去。

### Before

```ts
import { gzip } from "pako";
const compressed = gzip(uint8Array);
```

### After

```ts
async function compressGzip(data: Uint8Array): Promise<ArrayBuffer> {
  const cs = new CompressionStream("gzip");
  // ...
  return new Response(cs.readable).arrayBuffer();
}
```

## サイズ比較

| チャンク | Before | After |
|---|---|---|
| index.js（初期バンドル） | 769KB | **723KB (-46KB)** |

## 削除した依存

- `pako`
- `@types/pako`

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/utils/fetchers.ts` | `pako.gzip()` → `CompressionStream` API |
| `client/package.json` | `pako`, `@types/pako` 削除 |
