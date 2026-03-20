---
status: ready
priority: p1
issue_id: "010"
tags: [server, runtime, bun, performance, migration]
dependencies: ["008", "002"]
---

# Phase 3: Node.js → Bun ランタイム移行

## Problem Statement

Node.js + tsx はサーバー起動が遅く、HTTP スループット・メモリ使用量・ファイル I/O で Bun に劣る。Hono + Drizzle への移行完了後、ランタイムを Bun に切り替えることで Cold start 大幅改善・TTFB 改善・メモリ削減を実現する。

## Findings

- Bun は Node.js の ~4x 高速起動、~2.5x HTTP スループット、~30-50% メモリ削減
- Bun.file() は fs.readFile の ~10x 高速 → 静的ファイル配信高速化
- bun:sqlite は組み込み SQLite ドライバ → ネイティブバインディング不要
- TypeScript ネイティブ実行 → tsx 不要
- Hono は Bun.serve() アダプタをファーストクラスサポート

## Recommended Action

1. `@hono/node-server` → `Bun.serve()` に差し替え (数行)
2. `@hono/node-ws` → Bun 組み込み WebSocket に差し替え
3. `drizzle-orm/better-sqlite3` → `drizzle-orm/bun-sqlite` に import 変更
4. `tsx` 削除 (Bun がネイティブ TS 実行)
5. `pnpm` → `bun install` に移行
6. `better-sqlite3` パッケージ削除
7. Fly.io デプロイ設定の更新 (fly.toml は変更禁止のため Dockerfile のみ)

## Acceptance Criteria

- [ ] Node.js / tsx への依存がない
- [ ] `bun run` でサーバーが起動する
- [ ] bun:sqlite でDB操作が動く
- [ ] WebSocket が Bun 組み込みで動く
- [ ] VRT が全て通る
- [ ] 手動テスト項目が全て通る
- [ ] Fly.io にデプロイできる (fly.toml 変更なし)

## Work Log

### 2026-03-20 - 計画策定

**By:** Claude Code

**Actions:**
- Bun + Drizzle の公式ドキュメント確認
- Bun ランタイムのパフォーマンス特性調査
- Phase 1, 2 完了後の移行差分が最小限であることを確認

**Learnings:**
- Hono を挟むことで Phase 3 の変更が最小限になる (アダプタ差し替えのみ)
- fly.toml は変更禁止だが Dockerfile は変更可能
- better-sqlite3 → bun:sqlite は Drizzle の import 変更のみ
