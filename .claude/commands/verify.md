---
description: 変更後のデグレチェック（ビルド→VRT→スコア計測）を一括実行し、結果をサマリ表示する
---

# デグレチェック & スコア計測

以下のステップを順番に実行し、各ステップの結果を報告してください。
途中で失敗した場合はそこで止めて、失敗内容を詳しく報告してください。

## Step 1: ビルド

```bash
cd /Users/kenya.masuko/dev/web-speed-hackathon-2026/application && pnpm run build
```

- 成功/失敗を報告
- 失敗した場合はエラー内容を表示して終了

## Step 2: サーバー起動確認

`http://localhost:3000/` にアクセスできるか確認してください。

- アクセスできない場合は「サーバーが起動していません。`cd application && pnpm run start` で起動してから再実行してください」と案内して終了
- アクセスできる場合は次へ

## Step 3: DB初期化

```bash
curl -s -X POST http://localhost:3000/api/v1/initialize
```

- レギュレーション上、採点前にDBが初期状態である必要があるため実行する
- 失敗した場合はエラーを報告して終了

## Step 4: VRT (Visual Regression Test)

```bash
cd /Users/kenya.masuko/dev/web-speed-hackathon-2026/application/e2e && pnpm run test
```

- テスト結果のサマリ（passed / failed / skipped）を報告
- 失敗したテストがある場合は、テスト名と失敗理由を一覧表示
- **VRT失敗はレギュレーション違反に直結する** ことを警告

## Step 5: スコア計測

```bash
cd /Users/kenya.masuko/dev/web-speed-hackathon-2026/scoring-tool && pnpm start --applicationUrl http://localhost:3000
```

- 各ページのスコアと合計点を報告

## Step 6: 結果サマリ

以下の形式で最終結果を表示してください:

```
=== デグレチェック結果 ===
ビルド:    ✅ or ❌
DB初期化:  ✅ or ❌
VRT:       ✅ (XX passed) or ❌ (XX passed, XX failed)
スコア:    XXX / 1150 点

前回ベースライン比較:
- LCP: XXXXms → XXXXms (±XXXXms)
- CLS: X.XX → X.XX (±X.XX)
```

メモリ `project_performance_baseline.md` にある前回計測値と比較して、改善/劣化を明示してください。
劣化している指標がある場合は警告してください。
