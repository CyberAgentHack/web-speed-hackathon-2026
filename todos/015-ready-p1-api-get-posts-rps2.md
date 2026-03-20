---
status: ready
priority: p1
issue_id: "015"
tags: [server, performance, api, posts, n-plus-1]
dependencies: ["014"]
---

# GET /api/v1/posts の RPS=2 改善

## Problem Statement

API ベンチマーク（2026-03-20）で `GET /api/v1/posts` が **avg latency 4034ms, RPS=2** と壊滅的。タイムラインの根幹エンドポイントが事実上使えないレベル。

他の API エンドポイントは RPS 120-1856 の範囲なので、posts だけが突出して遅い。

## Findings

**API ベンチ結果:**
| エンドポイント | avg latency | RPS |
|---------------|-------------|-----|
| **get_posts** | **4034ms** | **2** |
| get_user_posts | 79ms | 124 |
| get_post_comments | 66ms | 150 |
| get_post_detail | 34ms | 290 |

**原因:**
1. N+1 問題: 投稿一覧で各投稿の画像・コメント数を個別クエリで取得
2. DB インデックス不足（014 で対応）
3. Sequelize defaultScope の過剰 eager loading（001 で対応）

## Proposed Solutions

1. インデックス追加（014）+ Sequelize scope 最適化（001）の組み合わせで改善
2. 投稿一覧専用の軽量クエリを作成（JOIN でワンクエリ化）
3. レスポンスキャッシュ（ETag / stale-while-revalidate）

## Recommended Action

014（インデックス）→ 001（scope 最適化）の順で実施し、効果計測。まだ不足なら専用クエリ作成。

## Acceptance Criteria

- [ ] `GET /api/v1/posts` の avg latency が 100ms 以下
- [ ] `GET /api/v1/posts` の RPS が 50 以上
- [ ] VRT テスト全パス

## Work Log

### 2026-03-20 - ベンチマーク結果から問題特定

**By:** Claude Code

**Actions:**
- bench/api.sh で全 API エンドポイントの latency/RPS 計測
- get_posts が RPS=2 と壊滅的であることを確認
- DB インデックス不足 + N+1 が原因と特定
