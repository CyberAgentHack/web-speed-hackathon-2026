---
name: critical-path-audit
description: LCP/FCP に直結する初期ロード経路を点検する。圧縮、cache-control、render-blocking リソース、LCP 発見経路を一括チェックする。「FCP が遅い」「圧縮効いてる？」「キャッシュ設定は？」「配信設定を見て」といった場面で使う。バンドルサイズの内訳には bundle-analyze を使うこと。
---

# クリティカルパス監査スキル

## 前提条件

- サーバーが起動していること（`http://localhost:3000` に接続可能）
- ビルド済みであること

## 監査項目

### 1. 圧縮（Compression）

確認対象: `application/server/src/app.ts` のミドルウェア構成

```bash
curl -s -o /dev/null -w '%{size_download}' -H 'Accept-Encoding: br' http://localhost:3000/
curl -s -o /dev/null -w '%{size_download}' http://localhost:3000/
```

| 項目 | 期待値 | 確認方法 |
|------|--------|---------|
| brotli 対応 | `Content-Encoding: br` | `curl -sI -H 'Accept-Encoding: br' http://localhost:3000/` |
| gzip 対応 | `Content-Encoding: gzip` | `curl -sI -H 'Accept-Encoding: gzip' http://localhost:3000/` |

初期状態では圧縮ミドルウェアが入っていない可能性が高い（Express のデフォルトは無圧縮）。

### 2. Cache-Control

確認対象: `application/server/src/app.ts` と `application/server/src/routes/static.ts`

```bash
curl -sI http://localhost:3000/ | grep -i cache-control
curl -sI http://localhost:3000/scripts/main.js | grep -i cache-control
```

初期状態: `Cache-Control: max-age=0, no-transform`, `etag: false`, `lastModified: false`

| リソース | 推奨 Cache-Control |
|---------|-------------------|
| HTML | `no-cache` または短い max-age |
| JS/CSS（ハッシュ付き） | `public, max-age=31536000, immutable` |
| 画像・動画・音声 | `public, max-age=3600` 以上 |
| API レスポンス | 用途に応じて `no-store` または短い max-age |

### 3. Render-Blocking リソース

```bash
curl -s http://localhost:3000/ | grep -E '<(script|link|style)'
```

初期状態で注意すべき点:
- `<script src="/scripts/main.js">` — defer/async なし → **render-blocking**
- `<link rel="stylesheet" href="/styles/main.css">` — head 内 → **render-blocking**
- `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.2.1">` — **render-blocking + 外部 CDN**

### 4. LCP 要素の発見経路

| ページ | LCP 候補 | 発見経路 |
|--------|---------|---------|
| ホーム | タイムライン内の画像 / テキスト | JS 実行後（SPA） |
| 投稿詳細 | 投稿テキスト / メディア | JS 実行後（SPA） |
| DM 一覧 | リスト要素 | JS 実行後（SPA） |
| 利用規約 | テキスト | JS 実行後（SPA） |

このプロジェクトは SPA（SSR なし）なので、全ページで LCP 要素は JS 実行後に発見される。
SSR 導入で HTML parse 中に LCP 要素を発見可能にするのが理想だが、大改造になる。

### 5. 転送サイズの確認

```bash
curl -s -o /dev/null -w '%{size_download}' http://localhost:3000/scripts/main.js
```

chrome-devtools MCP で `list_network_requests` を使うとより正確。

## 出力

`perf-measurements/latest/critical-path-audit.md` に記録:

```markdown
# クリティカルパス監査結果

**監査日**: YYYY-MM-DD

## 圧縮
| リソース | 無圧縮 | 圧縮後 | 削減率 | 状態 |

## Cache-Control
| リソース種別 | 現在の値 | 推奨値 |

## Render-Blocking
| リソース | ブロッキング | 対策 |

## LCP 発見経路
| ページ | 経路 | 改善余地 |

## 即座に改善できる項目
1. ...
```

## Quick Reference

| 項目 | 値 |
|------|-----|
| Express アプリ | `application/server/src/app.ts` |
| 静的配信 | `application/server/src/routes/static.ts` |
| HTML テンプレート | `application/client/src/index.html` |
| 静的アセット | `application/public/`, `application/dist/` |
| サーバーポート | 3000 (dev) / 8080 (prod) |
