# CLAUDE.md

## 改善作業フロー

1. **実装** — コード変更を行う
2. **VRT** — ビルド → サーバー起動 → `pnpm --filter @web-speed-hackathon-2026/e2e run test` で VRT 実行。新規失敗がないことを確認
3. **計測** — VRT が OK なら `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000` でスコア計測
4. **log 記録** — `memo/log/` に連番で記録（変更内容、計測結果、前回比較、分析）

## ビルド・起動コマンド

```bash
cd application
pnpm run build        # クライアントビルド (vite build)
pnpm run start        # サーバー起動 (localhost:3000)
```

## レギュレーション要点

- fly.toml を変更してはならない
- VRT と手動テスト項目が失敗しないこと
- SSE ストリーミングプロトコルを変更してはならない
- `POST /api/v1/initialize` でDBリセットできること
