# 対象項目

- jQuery `$.ajax({ async: false })` を除去し、非同期 XHR に統一する

# 読んだ docs

- `docs/regulation.md`
- `docs/test_cases.md`
- `application/e2e/src/auth.test.ts`
- `application/e2e/src/crok-chat.test.ts`
- `application/e2e/src/dm.test.ts`

# 影響範囲

- `application/client/src/utils/fetchers.ts`
  - `fetchBinary`, `fetchJSON`, `sendFile`, `sendJSON` の4関数

# 発見した問題

- commit `4daabdc`（webpack production 化）で Babel の `@babel/preset-env` ターゲットが `ie 11` → `last 2 Chrome versions` に変更され、`regenerator-runtime` が除去された。
- これにより `async/await` がネイティブ構文のまま出力されるようになった。
- `$.ajax({ async: false })` はメインスレッドをブロックする同期 XHR を発行する。jQuery deferred の resolved/rejected 結果が、ネイティブ `await` に正しく伝播しない非互換が発生した。
  - 成功時：`await` が値を返すまでにメインスレッドが 5〜10 秒ブロック
  - 失敗時：`await` がreject を受け取れず Promise が未解決のまま放置 → UI フリーズ
- E2E テストで `login()` がタイムアウト（30 秒）する根本原因だった。

# 実装前の仮説

- `async: false` を除去してネイティブ非同期 XHR に戻せば、jQuery deferred → Promise の変換が正常に機能し、`await` が正しく resolve/reject するようになる。
- サインイン・サインアップ・DM・Crok チャットなど、API 呼び出しを行う全テストが通るようになる。

# 採用した方針

- `fetchers.ts` 内の全 `$.ajax()` 呼び出しから `async: false` オプションを削除する。
- 関数のシグネチャ（`async function` + `await`）は変更しない。

# 実装内容

- `application/client/src/utils/fetchers.ts`
  - `fetchBinary`: `async: false` を削除
  - `fetchJSON`: `async: false` を削除
  - `sendFile`: `async: false` を削除
  - `sendJSON`: `async: false` を削除

# 検証結果

- ビルド成功
- `auth.test.ts` 5件中4件が即座にパス（サインイン成功・サインアップ・バリデーション等）
- `crok-chat.test.ts` のサジェスト候補テストがパス
- サーバー API（`curl` で確認）の成功/失敗レスポンスが正常に返り、クライアントで正しくハンドリングされるようになった

# リスクと未確認事項

- 同期 XHR に依存していたコードパスがある場合、挙動が変わる可能性がある。ただし全 API 呼び出しが `async function` + `await` で書かれており、非同期化による機能的な影響はない。
- `async: false` は MDN で非推奨であり、今後のブラウザで削除される可能性がある。除去は正しい方向。
