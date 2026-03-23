# CaX パフォーマンス分析レポート

## 前提

- `docs/scoring.md` を確認し、採点対象が `ホーム / 投稿詳細 / 写真つき投稿詳細 / 動画つき投稿詳細 / 音声つき投稿詳細 / DM一覧 / DM詳細 / 検索 / 利用規約` で、評価指標が `CLS / FCP / LCP / SI / TBT` であることを前提に分析した。
- `scoring-tool` も確認し、特に `検索` は `GET /search` 単体、`DM一覧` はサインイン後に `GET /dm`、`音声つき投稿詳細` は固定投稿 ID の詳細ページを直接計測することを確認した。
- これは静的解析レポート。Lighthouse 実測はしていない。

## 結論

最優先で手を入れるべきなのは次の 5 点です。

1. `AspectRatioBox` の 500ms 遅延と非表示レンダリングをやめる
2. 初回ロードで不要な chunk を読んでいる構成を解消する
3. 音声ページの「全 MP3 ダウンロード完了まで何も出さない」実装をやめる
4. DM API の過剰レスポンスを削る
5. 静的配信の圧縮不足と巨大スプライト/巨大フォントを解消する

この 5 点は、採点対象ページを横断して `FCP / LCP / SI / TBT / CLS` に効く可能性が高い。

## 優先度順の所見

### 1. `AspectRatioBox` が 500ms 後まで中身を描画しない

- 根拠: `application/client/src/components/foundation/AspectRatioBox.tsx:16-34`
- 問題:
  - 高さ計算を `setTimeout(..., 500)` に依存している
  - `clientHeight !== 0` になるまで子要素を描画しない
  - 画像・動画・音声波形の土台に広く使われている
- 影響ページ:
  - `画像つき投稿`, `動画つき投稿`, `音声つき投稿`, `ホーム`, `検索結果タイムライン`
- 指標への影響:
  - `FCP/LCP/SI`: 主コンテンツが最低 500ms 遅れて出る
  - `CLS`: 高さ 1px の箱から実寸へ伸びるためレイアウトが後から動く
- 伝播箇所:
  - `application/client/src/components/post/ImageArea.tsx:13`
  - `application/client/src/components/foundation/PausableMovie.tsx:84`
  - `application/client/src/components/foundation/SoundPlayer.tsx:64`
- 対応方針:
  - CSS `aspect-ratio` に置き換える
  - JS 計測と `setTimeout(500)` を除去する
  - 高さ確定前でもプレースホルダを描画する

### 2. 初回 HTML が不要な page chunk / modal chunk を先読みしている

- 根拠:
  - `application/dist/index.html:7-14`
  - `application/client/vite.config.ts:34-58`
  - `application/client/vite.config.ts:98-114`
  - `application/client/src/containers/AppContainer.tsx:7-8`
  - `application/client/src/containers/AppContainer.tsx:121-123`
- build artifact 確認:
  - `application/dist/scripts/index.js`: `196K`
  - `application/dist/scripts/chunk-BnexmxNo.js`: `1.3M`
  - `application/dist/scripts/chunk-D7R8oLaC.js`: `130K`
  - `application/dist/scripts/chunk-DQ3q-IQD.js`: `443K`
  - `application/dist/styles/page-crok.css`: `28K`
- 問題:
  - `/` でも `/terms` でも `/dm` でも、`page-crok` 相当の CSS/JS と `modal-post` 相当の chunk を先読みしている
  - `NewPostModalContainer` は全ページで常時マウントされる構成
  - ルート分割していても、実ビルドでは初回ロードがかなり重い
- 指標への影響:
  - `FCP/LCP/SI`: 初回ネットワーク競合
  - `TBT`: parse/compile/execute コスト増
- 補足:
  - `chunk-BnexmxNo.js` は `react-markdown / remark / rehype-katex / katex` を含む
  - `chunk-DQ3q-IQD.js` は `ffmpeg / magick-wasm` 系を含む
  - `chunk-D7R8oLaC.js` は `kuromoji / redux-form` 系を含む
- 対応方針:
  - 投稿モーダルを本当に on-demand にする
  - Crok 関連 CSS/JS を非 Crok ページへ漏らさない
  - 検索ページの初期表示に不要な形態素解析系を別 chunk に逃がす

### 3. 画像もプロフィール画像も一律 `loading="lazy"` になっている

- 根拠:
  - `application/client/src/components/foundation/CoveredImage.tsx:26-31`
  - `application/client/src/components/timeline/TimelineItem.tsx:58-63`
  - `application/client/src/components/post/PostItem.tsx:23-28`
  - `application/client/src/components/direct_message/DirectMessageListPage.tsx:87-93`
- 問題:
  - ファーストビュー内でも eager / `fetchpriority="high"` が使われていない
  - 詳細ページの主画像や一覧上部のアバターまで遅延対象になる
- 指標への影響:
  - `LCP/FCP/SI`: LCP 候補画像の取得開始が遅れる
- 対応方針:
  - 先頭 1 件や詳細ページの主メディアだけは eager 化する
  - アバターは上部表示分だけ eager、残りを lazy にする

### 4. 音声ページは MP3 全体を取得し終えるまで UI が出ない

- 根拠:
  - `scoring-tool/src/scoring/calculate_post_audio_page.ts:16-27`
  - `application/client/src/components/foundation/SoundPlayer.tsx:14-19`
  - `application/client/src/components/foundation/SoundPlayer.tsx:40-42`
  - `application/client/src/components/foundation/SoundWaveSVG.tsx:9-28`
  - `application/client/src/components/foundation/SoundWaveSVG.tsx:42-46`
- 問題:
  - `fetchBinary()` で MP3 を丸ごと `ArrayBuffer` 化
  - データ取得完了までは `return null`
  - さらに `AudioContext.decodeAudioData()` と全サンプル走査を main thread で実行
- 指標への影響:
  - `FCP/LCP/SI`: 音声プレイヤー本体が遅れて出る
  - `TBT`: 波形生成の CPU コストが大きい
- 対応方針:
  - 先に `<audio src="/sounds/...mp3">` だけ表示する
  - 波形は遅延生成するか、サーバーで事前計算する
  - 少なくともロード中の固定高さプレースホルダを出す

### 5. 動画ページは poster なし、`preload="metadata"` のみ

- 根拠:
  - `application/client/src/components/foundation/PausableMovie.tsx:91-99`
- 問題:
  - 視覚の主役が動画なのに `poster` がない
  - `metadata` だけでは初期フレーム表示が遅れやすい
  - しかも土台は `AspectRatioBox` に依存している
- 指標への影響:
  - `LCP/SI`: 動画つき投稿詳細でヒーロー表示が遅い
- 対応方針:
  - poster を用意する
  - 先に poster を表示し、再生準備後に video へ切り替える

### 6. DM一覧 API が「会話一覧」に不要な全メッセージ履歴を返している

- 根拠:
  - `application/server/src/models/DirectMessageConversation.ts:49-59`
  - `application/server/src/routes/api/direct_message.ts:21-36`
  - `application/client/src/components/direct_message/DirectMessageListPage.tsx:71-81`
- 問題:
  - デフォルトスコープで `initiator/member/messages/sender/profileImage` を全部 join
  - `/api/v1/dm` では各会話の最後の 1 件と未読判定に近い情報しか使っていない
  - なのに会話ごとの全履歴を返している
- 指標への影響:
  - `FCP/LCP/SI`: DM一覧の API レスポンスが重い
  - `TBT`: JSON parse と React render コスト増
- 追加の表示上の問題:
  - `application/client/src/components/direct_message/DirectMessageListPage.tsx:44-46` で取得完了まで `null`
- 対応方針:
  - `/dm` 用に軽量 DTO を分ける
  - `lastMessage`, `hasUnread`, `peer` だけ返す
  - ローディング時は高さ固定の skeleton を出す

### 7. 検索ページの初期表示に不要な形態素解析系が混ざっている

- 根拠:
  - `scoring-tool/src/scoring/calculate_search_page.ts:16-27`
  - `application/client/src/components/application/SearchPage.tsx:19`
  - `application/client/src/components/application/SearchPage.tsx:62-84`
  - `application/client/src/utils/negaposi_analyzer.ts:1-30`
  - `application/client/src/utils/kuromoji.ts:1-28`
  - `application/client/vite.config.ts:47-58`
- 問題:
  - 採点では `GET /search` 単体なのに、検索ページ本体が `analyzeSentiment` を静的 import している
  - その先で `kuromoji` と辞書ロード系に依存している
  - 辞書ファイルも大きい (`base.dat.gz 3.8M`, `tid_pos.dat.gz 5.6M`)
- 指標への影響:
  - `FCP/LCP/SI/TBT`: 空の検索ページ表示に不要な JS/依存が載る
- 対応方針:
  - ネガポジ判定は検索実行後、または idle 時に遅延 import する
  - 単なるフォーム初期表示からは完全に切り離す

### 8. `scheduler.postTask(... user-blocking, delay: 1)` の無限ループがある

- 根拠:
  - `application/client/src/hooks/use_search_params.ts:9-27`
  - `application/client/src/hooks/use_has_content_below.ts:16-33`
- 問題:
  - 1ms 間隔相当のポーリングを `user-blocking` 優先度で常時回している
  - 検索ページでは常に `useSearchParams()` が動く
  - Crok ではスクロールボタン判定が常時回る
- 指標への影響:
  - `TBT`: 長時間 CPU を食う
  - `SI`: 描画と競合する
- 対応方針:
  - URL は router state / `popstate` に寄せる
  - 位置判定は `scroll` / `resize` / `IntersectionObserver` に置き換える

### 9. 静的配信はキャッシュ制御はあるが、圧縮の実装が見当たらない

- 根拠:
  - `application/server/src/app.ts:42-60`
  - `application/server/src/routes/static.ts:25-53`
- 推定:
  - `serveStatic` とヘッダ設定のみで、gzip/brotli middleware が見当たらない
- 影響:
  - `196K` の entry JS、`1.3M` の chunk、`639K` の SVG sprite、`6.3M` の OTF font がそのまま飛ぶと初回表示がかなり不利
- 指標への影響:
  - `FCP/LCP/SI`: 転送量増
  - `TBT`: 大きい JS をそのまま parse
- 対応方針:
  - gzip/brotli を有効化
  - ハッシュ付き asset には `immutable` を付ける

### 10. フォントとアイコン配信が重い

- 根拠:
  - `application/client/src/index.css:5-18`
  - `application/client/src/components/foundation/FontAwesomeIcon.tsx:6-10`
- asset size 確認:
  - `application/public/fonts/ReiNoAreMincho-Regular.otf`: `6.3M`
  - `application/public/fonts/ReiNoAreMincho-Heavy.otf`: `6.3M`
  - `application/public/sprites/font-awesome/solid.svg`: `639K`
- 問題:
  - 利用規約ページの計測対象フォントが OTF のまま大きい
  - アイコン 1 個のために巨大 SVG スプライトを引く構成
- 指標への影響:
  - `Terms` の `FCP/LCP/SI`
  - 全ページの nav / button icon 周辺の `FCP/SI`
- 対応方針:
  - 規約フォントは WOFF2 化・サブセット化
  - Font Awesome は使用アイコンのみ inline / subset 化

## 着手順の提案

1. `AspectRatioBox` を CSS 化する
2. `index.html` で先読みされる不要 chunk を削る
3. `SoundPlayer` をストリーミング再生前提に作り直す
4. `/api/v1/dm` を軽量化する
5. gzip/brotli と asset 最適化を入れる
6. 検索の `kuromoji/negaposi` を遅延ロードに寄せる
7. 利用規約フォントと Font Awesome スプライトを縮小する

## 補足

- `docs/test_cases.md` を見る限り、画像/動画/音声の表示品質や波形表示そのものは維持が必要。したがって「消す」のではなく「初期表示を軽くしつつ後から完成させる」方向が安全。
- 特に `ページの表示` で 300 点を超えないと `ページの操作` が採点されないため、まずは上の 1〜5 を優先するのが妥当。
