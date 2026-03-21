---
status: ready
priority: p1
issue_id: "011"
tags: [perf, api, dm, overfetching]
dependencies: []
---

# DM API レスポンス最適化 — overfetching の解消

## Problem Statement

DM 一覧・詳細 API が read model に対して不必要なデータまで返している可能性。DM リスト取得に 845ms（テスト計測、大半はデータ待ち）かかっている。

## Findings

- `GET /api/v1/dm` レスポンスサイズ未計測（全会話 + 全メッセージを返している可能性）
- `GET /api/v1/dm/:id` レスポンスは 350KB（全メッセージ + sender 情報を含む）
- API レスポンス時間自体は 7ms（サーバー側は速い）
- ボトルネックはレスポンスサイズによるパース・転送コスト

## Investigation Needed

- [ ] `GET /api/v1/dm` のレスポンスサイズと構造を確認
- [ ] DM 一覧表示に必要な最小フィールドを特定（一覧では最新メッセージ 1 件のみで十分）
- [ ] `GET /api/v1/dm/:id` で全メッセージを返す必要があるか（ページネーション検討）
- [ ] `findConversationWithRelations` / `findConversations` のクエリで不要な JOIN を削減

## Acceptance Criteria

- [ ] DM 一覧 API のレスポンスサイズが現状の 50% 以下
- [ ] DM 詳細 API のレスポンスサイズが 350KB から大幅に削減
- [ ] E2E テストが全てパスする（機能落ちなし）
