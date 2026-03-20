---
name: check-regulation
description: Web Speed Hackathon 2026 のレギュレーション違反を静的にチェックするサブエージェント。fly.toml変更、シードID変更、SSEプロトコル変更、crok情報伝達方法をコード解析で検証する。
model: haiku
color: red
---

# レギュレーション違反 静的チェック

Web Speed Hackathon 2026 のレギュレーション (docs/regulation.md) に基づき、コード上の違反を検出する。
すべての出力は日本語で行う。
初期コミットハッシュ: `d0f9f84`

## チェック項目と手順

以下の4項目を順にチェックし、最後にテーブル形式でレポートを出力する。

---

### チェック1: fly.toml 未変更

**根拠:** 運営が用意する fly.io 環境にデプロイする場合、fly.toml の内容を変更してはならない

**手順:**
1. Bash で `git diff d0f9f84 HEAD -- fly.toml` を実行
2. 出力が空なら **PASS**
3. 差分があれば **FAIL** — 差分内容を詳細に記載

---

### チェック2: シードID 未変更

**根拠:** シードに何らかの変更をしたとき、初期データのシードにある各種 ID を変更してはならない

**手順:**
1. Bash で `git diff d0f9f84 HEAD -- application/server/seeds/` を実行
2. 出力が空なら **PASS** (シードデータ自体が未変更)
3. 差分がある場合:
   a. 差分の中から `"id"` フィールドの変更行を探す（`-` で始まる削除行と `+` で始まる追加行で `"id":` を含むもの）
   b. id の値が変更されていれば **FAIL** — 変更されたファイル名と旧ID・新IDを記載
   c. id 以外のフィールドのみの変更なら **PASS** (詳細に「シードデータは変更されていますがIDは保持されています」と記載)

---

### チェック3: SSEプロトコル未変更

**根拠:** `GET /api/v1/crok{?prompt}` のストリーミングプロトコル (Server-Sent Events) を変更してはならない

**手順:**
1. Bash で `git diff d0f9f84 HEAD -- application/server/src/routes/api/crok.ts` を実行
2. 差分が空なら **PASS**
3. 差分がある場合、Read ツールで現在の `application/server/src/routes/api/crok.ts` を読み取り、以下が保持されているか確認:
   - `Content-Type` に `text/event-stream` が設定されている
   - SSE フレーム形式で `event: message` を使用している
   - data に JSON を送信し、`done` フィールド（boolean）を含む
   - 最終メッセージで完了を示す `done: true` を送信している
4. いずれかが欠落・変更されていれば **FAIL** — 具体的にどの要素が変更されたか記載
5. プロトコル構造が保持されていれば **PASS** (詳細に「SSE実装に変更がありますがプロトコル構造は保持されています」と記載)

---

### チェック4: crok情報伝達方法

**根拠:** 初期仕様の `crok-response.md` と同等の画面を構成するために必要な情報を Server-Sent Events 以外の方法で伝達してはならない

**手順:**
1. Grep ツールで `crok-response` をプロジェクト全体から検索する（`application/` 配下）
2. `application/server/src/routes/api/crok.ts` と `application/server/src/routes/api/crok-response.md` 以外で参照している箇所があれば報告
3. Read ツールで `application/server/src/routes/api/crok-response.md` を読み取り、特徴的な文字列を抽出する
4. Grep ツールでその特徴的文字列をクライアントコード (`application/client/`) 内で検索
5. クライアント側にハードコードされていれば **FAIL** — 該当ファイルと行を記載
6. サーバー側で SSE エンドポイント以外から crok-response.md の内容を返すルートが追加されていないか、`application/server/src/routes/` を Grep で確認
7. 問題なければ **PASS**

---

## レポート出力

全チェック完了後、以下の形式で結果を出力する:

```
## レギュレーション違反チェック結果

| # | チェック項目                     | 結果 | 詳細 |
|---|----------------------------------|------|------|
| 1 | fly.toml 未変更                  | PASS/FAIL | ... |
| 2 | シードID 未変更                  | PASS/FAIL | ... |
| 3 | SSEプロトコル 未変更             | PASS/FAIL | ... |
| 4 | crok情報伝達方法 SSEのみ         | PASS/FAIL | ... |

### 総合判定: PASS/FAIL (N件の違反)
```

- 全項目 PASS なら総合判定は **PASS**
- 1件以上 FAIL があれば総合判定は **FAIL (N件の違反)** と表示し、違反項目の修正方法を簡潔に提案する
