---
status: ready
priority: p2
issue_id: "019"
tags: [scoring, user-flow, inp, tbt, performance]
dependencies: ["015"]
---

# ユーザーフローテスト INP/TBT 最適化

## Problem Statement

ユーザーフローテスト（認証、DM送信、検索、Crok、投稿）はサインインモーダル修正 (015) で計測可能になるが、
INP (25点) + TBT (25点) = 50点/テストの最大化が必要。

## Findings

### 各フローの計測内容

1. **認証フロー** (50点) — サインアウト→サインイン操作の INP/TBT
2. **DM送信** (50点) — 新規DM作成→メッセージ2通送信の INP/TBT
3. **検索** (50点) — 2回の検索実行の INP/TBT
4. **Crok AI** (50点) — SSE ストリーミング応答中の INP/TBT
5. **投稿** (50点) — テキスト/画像/動画/音声の4種投稿の INP/TBT

### INP に影響する要素
- モーダル開閉のアニメーション
- フォーム入力のレスポンス
- WebSocket メッセージ処理
- 画像/動画/音声のクライアントサイド変換（FFmpeg WASM, ImageMagick WASM）

### TBT に影響する要素
- ページ遷移時の React ツリー再構築
- SWR のデータ取得
- WebSocket 接続確立
- WASM モジュールの初期化

## Proposed Solutions

### Option 1: WASM 変換の Web Worker 化

**Approach:** FFmpeg/ImageMagick WASM をメインスレッドから Web Worker に移動。

**Pros:** メインスレッドのブロッキング解消
**Cons:** Worker 間通信のオーバーヘッド
**Effort:** 2-3時間
**Risk:** Medium

### Option 2: フォーム操作の最適化

**Approach:** redux-form の不要な re-render を抑制、入力のデバウンス最適化。

**Pros:** INP 改善
**Cons:** フォームバリデーションの遅延
**Effort:** 1時間
**Risk:** Low

## Recommended Action

015 完了後に各フローを計測し、ボトルネックを特定してから対処。

## Acceptance Criteria

- [ ] 全ユーザーフローテストが計測可能
- [ ] 各フローの INP スコアが 15/25 以上
- [ ] 各フローの TBT スコアが 15/25 以上

## Work Log

### 2026-03-21 - 初回分析

**By:** Claude Code

**Actions:**
- 全5フローの scoring-tool テストコード分析
- 各フローの操作ステップ・セレクタ・タイムアウト値を文書化
- INP/TBT に影響する処理を特定
