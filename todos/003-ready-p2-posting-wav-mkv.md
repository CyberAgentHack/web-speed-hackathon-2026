---
status: complete
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

## Root Cause

- WAV: `music-metadata` が RIFF INFO チャンクの Shift_JIS バイト列を UTF-8 として解釈し文字化け
- MKV: 実行時点で既にパスしていた（問題なし）

## Fix

`extract_metadata_from_sound.ts` で WAV ファイルの RIFF INFO チャンクを直接パースし、
`TextDecoder('utf-8', { fatal: true })` → `TextDecoder('shift_jis')` のフォールバックでデコード。

## Acceptance Criteria

- [x] WAV音声の投稿テストがパスする
- [x] MKV動画の投稿テストがパスする
