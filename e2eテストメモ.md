あります。しかも 2 系統あります。

- 自動テスト: Playwright の E2E / VRT
  - テスト本体は [application/e2e/src](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/src)
  - 例: [home.test.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/src/home.test.ts), [search.test.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/src/search.test.ts), [dm.test.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/src/dm.test.ts), [posting.test.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/src/posting.test.ts)
  - 設定は [playwright.config.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/playwright.config.ts)
  - 起動前に [globalSetup.ts](/home/dev/webspeedhackathon/web-speed-hackathon-2026/application/e2e/globalSetup.ts) が `/api/v1/initialize` を叩いて初期化します

- 手動テスト: 運営チェック用の項目一覧
  - [docs/test_cases.md](/home/dev/webspeedhackathon/web-speed-hackathon-2026/docs/test_cases.md)

進め方はこれが一番わかりやすいです。

1. 依存を入れる
```bash
mise trust
mise install
cd application
pnpm install --frozen-lockfile
```

2. アプリをビルドして起動する
```bash
pnpm run build
pnpm run start
```

3. Playwright を一度入れる
```bash
pnpm --filter @web-speed-hackathon-2026/e2e exec playwright install chromium
```

4. E2E / VRT を回す
```bash
cd application/e2e
pnpm run test
```

5. スナップショットを更新したいとき
```bash
pnpm run test:update
```

ローカルではなくデプロイ先を叩くならこうです。

```bash
cd application/e2e
E2E_BASE_URL=https://your-app.example.com pnpm run test
```

補足すると、運営メッセージの文脈では `docs/test_cases.md` がかなり重要です。E2E が通っても、ここに書かれている仕様を落としているとアウトになり得ます。特にこのリポジトリだと、DM、投稿メディア、検索、Crok あたりは高速化のために壊しやすいです。

必要なら次に、
- 「最低限どのテストを毎回回すべきか」
- 「変更箇所ごとのチェックリスト」
- 「今触っている search 改善で落ちやすいテスト」
の3つに絞って一緒に整理できます。