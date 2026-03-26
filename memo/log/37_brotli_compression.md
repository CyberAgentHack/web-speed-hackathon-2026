# 37. brotli圧縮の導入 (2026-03-21)

## 変更内容

`compression` パッケージを `shrink-ray-current` に置き換え、brotli圧縮を有効化。

## 理由

`compression` はgzip/deflateのみ対応。brotliはgzip比で15-25%小さいレスポンスを返せる。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/app.ts` | `compression()` → `shrinkRay()` |
| `server/package.json` | `shrink-ray-current` 追加 |

## 効果

メインバンドル（229KB）の転送サイズ:
- gzip: 72KB
- brotli: 62KB（14%削減）

## 計測

未計測
