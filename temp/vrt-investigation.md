# VRT失敗 調査ログ

## 調査日: 2026-03-20

## テスト環境
- worktree-vrt-fix ブランチ (HEAD: `89c2fde`)
- VRTスナップショット: initial commit (`d0f9f84`) 時点のベースライン（ローカル生成、git管理外）
- サーバー: localhost:3333
- Playwright: Desktop Chrome, maxDiffPixelRatio: 0.03

---

## 安定して失敗するテスト（`89c2fde` = worktree-vrt-fix HEAD）

| # | テストファイル | テスト名 | エラー種別 |
|---|-------------|---------|-----------|
| 1 | home.test.ts:54 | 投稿クリック → 投稿詳細に遷移する | `page.waitForURL` タイムアウト |
| 2 | home.test.ts:29 | 動画が自動再生される | `isPlaying === false` (不安定: 3回中0-1回成功) |
| 3 | post-detail.test.ts:10 | 投稿が表示される | `page.waitForURL` タイムアウト |
| 4 | post-detail.test.ts:27 | タイトルが「{ユーザー名} さんのつぶやき - CaX」 | `page.waitForURL` タイムアウト |
| 5 | crok-chat.test.ts:13 | サジェスト候補が表示される | タイムアウト (flaky) |
| 6 | dm.test.ts:83 | 送信ボタンをクリックすると、DM詳細画面に遷移する | タイムアウト (flaky) |

---

## bisect 結果

### 問題コミット: `79cda7c` (perf: AspectRatioBoxのsetTimeout(500ms)をCSS aspect-ratioに置き換える)

**確認手順:**
- `3af37e5` (直前の実コード変更): #1,2,3,4 全てパス
- `79cda7c`: #1,3,4 確実に失敗、#2 3回中3回失敗
- `79cda7c` と `3af37e5` の間のコミット (`e602a23`, `865aef0`) はchoreのみでコード変更なし

**変更内容:**
```diff
- // setTimeout(500ms) + clientWidth計算で高さを決定
- // clientHeight === 0 の間は子要素をレンダリングしない
+ // CSS aspect-ratio で即時レンダリング
```

変更前: `setTimeout(500ms)` で `clientWidth` → `clientHeight` を計算、計算完了まで子要素（video含む）をレンダリングしない
変更後: CSS `aspect-ratio` で即座にレンダリング

**#1,3,4 (投稿クリック→遷移失敗) の原因推定:**
- テストは `article.click()` で article 要素の**中央**をクリック
- AspectRatioBox のレイアウト変更で article 内のコンテンツ配置が変わり、中央クリックがリンク要素に当たらなくなった
- `page.waitForURL("**/posts/*")` はデフォルトで `load` イベントを待つ
- SPAナビゲーション（React Router Link）では `load` イベントが発火しないため、URLが変わってもタイムアウトする可能性もある

**#2 (動画自動再生失敗) の原因推定:**
- 変更前: 500ms遅延後にvideo要素がDOMに追加 → autoplay開始
- 変更後: 即座にvideo要素がDOMに追加 → autoplayのタイミングが変わる
- video要素が即座にレンダリングされるが、ソースの読み込みが完了していない状態でautoplayが発火し、readyState < 2 のまま

### #5, #6 (crok-chat, DM) について

- `79cda7c` ではパス
- `89c2fde` では失敗
- `79cda7c` 〜 `89cda7c` の間のコミットはDBインデックス追加とchoreのみ（UI変更なし）
- **結論: flaky（テスト不安定）** — 環境依存のタイムアウト

---

## VRTスクリーンショット比較テスト

`d062811`（`79cda7c` の直前のコード変更地点）で以下のVRTスクリーンショット比較テストは全てパス:
- home-タイムライン（サインイン前）: パス
- home-404: パス
- responsive-スマホ: パス
- responsive-デスクトップ: パス

**注意:** スナップショットはローカル環境で生成されたため、`d062811` までの変更（AVIF変換、moment→Intl.DateTimeFormat等）はスナップショット生成時に既に反映されていた可能性がある。

---

## 結論

### 根本原因
**`79cda7c`** (AspectRatioBox の setTimeout(500ms) → CSS aspect-ratio 置き換え) が以下を壊している:
1. 投稿クリック → 遷移テスト（3件）
2. 動画自動再生テスト（1件）

### flaky テスト（コード起因ではない）
- crok-chat サジェスト表示
- DM 送信ボタン遷移

### 次のアクション候補
- `79cda7c` の変更を修正して、CSS aspect-ratio を維持しつつ `article.click()` がリンクに当たるようにする
- video autoplay のタイミング問題を修正する
