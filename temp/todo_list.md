# 改善タスク一覧

## 優先度: 最高（TBT/INP/FCP に直結）

- [x] 012-InfiniteScrollの2^18ループを除去する
- [x] 013-postsAPIをサーバーサイドページネーションにする
- [x] 014-Tailwind CSSをビルド時処理に変更する
- [x] 015-window.loadイベント待ちを即時レンダリングに変更する
- [x] 004-jQueryをfetch APIに置き換える
- [x] 024-foundation/LinkをReact RouterのLinkに変更してSPAナビゲーションにする
- [x] 025-AspectRatioBoxのsetTimeout(500ms)をCSS aspect-ratioに置き換える
- [x] 026-DBの外部キーカラムにインデックスを追加する

## 優先度: 高（TBT/LCP に直結）

- [x] 001-Webpackをproductionモードにする
- [x] 002-splitChunksを有効化する
- [x] 003-Babelターゲットをモダンブラウザにしてポリフィルを除去する
- [x] 007-CoveredImageのバイナリfetch+EXIF解析をAPI経由のalt取得に変更する
- [x] 016-React.lazyでルートベースコード分割する
- [ ] 017-HTTP圧縮(compression)を追加する
- [ ] 018-静的アセットのキャッシュヘッダーを有効化する
- [x] 019-Connection closeヘッダーを除去する
- [ ] 027-1msポーリングをイベントリスナーに置き換える(setInterval/postTask)
- [ ] 028-font-displayをblockからswapに変更する
- [ ] 029-PausableMovie/SoundPlayerにIntersectionObserverで遅延fetchする
- [ ] 030-DM APIで全メッセージ返却をやめて最新1件+ページネーションにする

## 優先度: 中（LCP/SI/バンドルサイズ改善）

- [x] 006-シード画像をAVIFに事前変換する
- [x] 011-ユーザーアップロード画像をサーバー側でAVIF変換する
- [ ] 005-FFmpeg WASMを遅延読み込みにする
- [ ] 008-動画・音声ファイルを最適化する
- [x] 020-momentをIntl.DateTimeFormatに置き換える
- [ ] 021-重いライブラリを動的importにする(web-llm,katex,kuromoji等)
- [x] 022-SequelizeのdefaultScopeを最適化する
- [ ] 023-devtoolのsource-mapを本番で無効化する
- [ ] 031-imgタグにloading="lazy"を追加する
- [ ] 032-Font Awesome SVGスプライトを使用アイコンのみに絞る
- [ ] 033-lodashをnamed import(lodash-es)に変更してtree shakingを有効化する
- [ ] 034-create()後の冗長なfindByPk/reloadを除去する

## 優先度: 低（CLS/追加改善）

- [ ] 009-フォント読み込みを最適化する
- [ ] 010-CSSをクリティカルCSS分離する
- [ ] 035-フォントのpreloadヘッダーを追加する
- [ ] 036-タイムラインに仮想スクロールを導入する
