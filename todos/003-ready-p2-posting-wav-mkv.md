---
status: ready
priority: p2
issue_id: "003"
tags: [e2e, posting, wav, mkv, media-upload]
dependencies: []
---

# 投稿機能 — WAV音声・MKV動画の投稿

## Problem Statement

メディア投稿のE2Eテスト2件が失敗。

## Findings

失敗テスト:
- `posting.test.ts:85` — WAV 形式の音声を投稿でき、Shift_JIS メタデータが文字化けしないこと
- `posting.test.ts:121` — MKV 形式の動画を投稿でき、先頭5秒・正方形に切り抜かれること

クライアント側の WASM 処理（FFmpeg / ImageMagick）が関係している可能性。

## Acceptance Criteria

- [ ] WAV音声の投稿テストがパスする
- [ ] MKV動画の投稿テストがパスする
