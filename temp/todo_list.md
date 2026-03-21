# 改善タスク一覧

## 現在のスコア（2026-03-21 デプロイ環境計測）
- ページ表示: 701.15 / 900点
- ユーザーフロー: 112.50 / 250点（投稿フロー計測不可）
- 合計: 813.65 / 1150点

## 最優先: 機能バグ・VRT修正（レギュレーション違反リスク）

- [ ] 058-Show Translationの翻訳失敗を修正する [docs/手動テスト結果_208f7b.md](../docs/手動テスト結果_208f7b.md)
  - 現状: サーバーAPI+翻訳マップ方式で25種類のシードテキストのみ対応。本当は動的に翻訳を生成したい（無料翻訳API or WebLLMのBabelトランスパイル修正）
- [ ] 059-ホーム動画が冒頭5秒切り取りになっている問題を修正する [docs/手動テスト結果_208f7b.md](../docs/手動テスト結果_208f7b.md)
- [ ] 060-Crok AIレスポンスの数式・コードブロックがMarkdownレンダリングされない問題を修正する [docs/手動テスト結果_208f7b.md](../docs/手動テスト結果_208f7b.md)
- [ ] 037-AspectRatioBox CSS aspect-ratio化によるVRT失敗を修正する（投稿クリック遷移テスト4件失敗）
- [x] 061-Crok AI応答テストのタイムアウトを修正する（crok-chat.test.ts:42）

## 優先度: 最高（+50〜75点 フロー全体TBT改善）

- [x] 047-sendJSONのgzip(pako)処理を除去またはWorker化する（フローTBT+50-75点、全フローのTBT 0点の主因）
- [x] 041-ホームページの初期データをサーバー側で注入してLCP/TBTを改善する（ホーム+40-70点、投稿フロー+50点連鎖）→ SSGで実装済み

## 優先度: 高（各+10〜30点）

- [x] 048-DM詳細ページのMutationObserver/scrollTo削除でTBTを改善する（DM詳細TBT+20-30点、forced reflow連発）
- [x] 042-利用規約ページのFCP/SI改善する（利用規約+15-20点）→ SSGで実装済み、LCP 0→17.25改善確認
- [x] 046-写真投稿ページのLCPをpreloadで改善する（写真投稿LCP+10-20点、サーバー側Link preload）
- [x] 051-DM送信フローのTBTを改善する（DM送信TBT+20-25点、楽観的更新+key属性追加+typing debounce）
- [x] 052-Crok AIチャットフローのTBTを改善する（Crok TBT+20-25点、Markdown key削除+SSEバッチ化+useHasContentBelow最適化+サジェストdebounce）
- [x] 049-DM詳細ページのLCP/SI改善する（DM詳細+10-15点、スケルトンUI表示）
- [x] 053-DM詳細scrollToのforced reflow解消+WS差分更新でTBTを改善する（DM詳細TBT+15-25点）
- [x] 054-利用規約フォントをサブセット化する（7.3MB→52KB、利用規約SI+5-10点）+TermContainer lazy化
- [x] 057-Crok AIストリーミング中のrehypeKatex・remarkMathを省略してTBTを改善する
- [ ] 050-ホームページのCLSを改善する（ホームCLS+5-7点、スケルトンプレースホルダー）

## 優先度: 中（追加改善）

- [ ] 035-フォントのpreloadヘッダーを追加する（全ページFCP微改善）→ HTTP Linkヘッダーは逆効果のためrevert
- [ ] 010-CSSをクリティカルCSS分離する
- [ ] 036-タイムラインに仮想スクロールを導入する

## 保留（スコア上は解決済み）

- [x] 045-DM送信の楽観的更新とフォーム最適化でINPを改善する → INP 25点満点のため保留、TBT改善は047に統合

## 完了済み

- [x] 012-InfiniteScrollの2^18ループを除去する
- [x] 013-postsAPIをサーバーサイドページネーションにする
- [x] 014-Tailwind CSSをビルド時処理に変更する
- [x] 015-window.loadイベント待ちを即時レンダリングに変更する
- [x] 004-jQueryをfetch APIに置き換える
- [x] 024-foundation/LinkをReact RouterのLinkに変更してSPAナビゲーションにする
- [x] 025-AspectRatioBoxのsetTimeout(500ms)をCSS aspect-ratioに置き換える
- [x] 026-DBの外部キーカラムにインデックスを追加する
- [x] 001-Webpackをproductionモードにする
- [x] 002-splitChunksを有効化する
- [x] 003-Babelターゲットをモダンブラウザにしてポリフィルを除去する
- [x] 007-CoveredImageのバイナリfetch+EXIF解析をAPI経由のalt取得に変更する
- [x] 016-React.lazyでルートベースコード分割する
- [x] 017-HTTP圧縮(compression)を追加する
- [x] 018-静的アセットのキャッシュヘッダーを有効化する
- [x] 019-Connection closeヘッダーを除去する
- [x] 027-1msポーリングをイベントリスナーに置き換える(setInterval/postTask)
- [x] 028-font-displayをblockからswapに変更する
- [x] 029-PausableMovie/SoundPlayerにIntersectionObserverで遅延fetchする
- [x] 030-DM APIで全メッセージ返却をやめて最新1件+ページネーションにする
- [x] 006-シード画像をAVIFに事前変換する
- [x] 011-ユーザーアップロード画像をサーバー側でAVIF変換する
- [x] 005-FFmpeg WASMを遅延読み込みにする
- [x] 008-動画・音声ファイルを最適化する
- [x] 020-momentをIntl.DateTimeFormatに置き換える
- [x] 021-重いライブラリを動的importにする(web-llm,katex,kuromoji等)
- [x] 022-SequelizeのdefaultScopeを最適化する
- [x] 023-devtoolのsource-mapを本番で無効化する
- [x] 031-imgタグにloading="lazy"を追加する
- [x] 032-Font Awesome SVGスプライトを使用アイコンのみに絞る
- [x] 033-lodashをnamed import(lodash-es)に変更してtree shakingを有効化する
- [x] 034-create()後の冗長なfindByPk/reloadを除去する
- [x] 039-AppContainerの/api/v1/me待ちによるレンダリングブロックを解消する
- [x] 009-フォント読み込みを最適化する（OTF→woff2変換済み）
- [x] 037-FFmpeg・ImageMagick WASMをクライアントから完全除去する
