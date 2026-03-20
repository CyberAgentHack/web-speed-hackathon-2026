---
status: ready
priority: p1
issue_id: "028"
tags: [server, performance, images, avif]
dependencies: []
---

# 画像 AVIF 対応 + 最適化

## Problem Statement

現在 WebP 変換のみ (quality:80)。AVIF は WebP より 20-30% 高い圧縮率。また public/movies/ に 179MB の GIF ファイルが残存（MP4 は 3.1MB で既に使用中）。フォントも OTF 13.3MB + WOFF2 7.7MB が未最適化。

## Findings

- `image_optimization.ts` で JPG/PNG → WebP 変換あり（quality:80, in-memory cache）
- `get_path.ts` で movies は `.mp4` で参照（GIF 不使用）
- public/movies/*.gif は 179MB 占有しているが未使用 → 削除可能
- public/fonts/ に OTF 13.3MB が残存（WOFF2 サブセット 26KB あり）
- シード画像 30枚 (2.1MB) + プロフィール 31枚 (122KB)

## Proposed Solutions

### A. AVIF 変換追加（content negotiation）
- Accept ヘッダーで AVIF > WebP > JPEG の優先順位
- sharp で AVIF 変換 (quality:60-70)
- Effort: 小 | Risk: 低

### B. 不要アセット削除
- public/movies/*.gif 削除 (179MB)
- public/fonts/*.otf 削除（WOFF2 で十分）
- Effort: 極小 | Risk: 低

### C. ビルド時画像最適化
- シード画像を事前に WebP/AVIF に変換
- Effort: 中 | Risk: 中

## Recommended Action

**B → A** の順で実施。まず不要ファイル削除で 190MB+ 削減、次に AVIF content negotiation 追加。

## Acceptance Criteria

- [ ] WHEN `Accept: image/avif` ヘッダー送信 THEN AVIF で応答
- [ ] WHEN public/movies/ 確認 THEN GIF ファイルなし
- [ ] WHEN VRT 実行 THEN 全テスト通過
- [ ] WHEN Lighthouse 計測 THEN 画像転送量が削減

## Work Log
