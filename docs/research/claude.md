まず、提供されたURLと過去のコンテスト情報を調査します。調査が完了しました。以下、コンテスト中に参照できる情報源をカテゴリ別にまとめます。

---

## 1. 公式リポジトリ・過去問題

**今回（2025）の問題リポジトリ**
- https://github.com/CyberAgentHack/web-speed-hackathon-2025
  — 2025年のテーマは架空の動画配信サービス「AREMA」で、Webpackベースのフロントエンド＋Fastifyバックエンドの構成

**過去問題リポジトリ一覧**
- https://github.com/orgs/CyberAgentHack/repositories?q=web-speed-hackathon&type=source
  — 過去に開催した全年度のWeb Speed Hackathonの問題コードが公開されている

- https://github.com/CyberAgentHack/web-speed-hackathon-2024 — 2024年：架空のマンガサイト「Cyber TOON」
- https://github.com/CyberAgentHack/web-speed-hackathon-2023 — 2023年：架空のショッピングサイト「買えるオーガニック」
- https://github.com/CyberAgentHack/web-speed-hackathon-2021 — 2021年：架空のSNSサイト「CAwitter」
- https://github.com/CyberAgentHack/web-speed-hackathon-2020 — 2020年：架空のブログサイト「あみぶろ」

---

## 2. 公式解説・運営記事

- https://github.com/CyberAgentHack/web-speed-hackathon-2020/wiki/Web-Speed-Hackathon-Online-%E5%87%BA%E9%A1%8C%E3%81%AE%E3%81%AD%E3%82%89%E3%81%84%E3%81%A8%E8%A7%A3%E8%AA%AC
  — 2020年大会の出題のねらいと解説。Webpack設定、Babel、PostCSS、フォント最適化、Chunk Splitting、依存パッケージ最適化、処理の並列化・メモ化・遅延実行など、パフォーマンスチューニングテクニックを網羅的に解説。**最重要リファレンスの一つ**。

- https://developers.cyberagent.co.jp/blog/archives/28484/
  — 2020年大会の開催記。解説がパフォーマンスチューニングテクニックの概観として使えると運営側も自負している

- https://developers.cyberagent.co.jp/blog/archives/38227/
  — 2022年大会の一般向けオンライン開催告知。初めてパフォーマンスチューニングに取り組む方向けの攻略法も紹介

- https://note.com/ca_tech/n/nc5a4a4077ad6
  — 2024年大会の公式イベントレポート。運営構成や当日の流れ、レギュレーションチェックの注意点がまとまっている

---

## 3. WSH 2025 参加記・上位入賞者のwriteup

- https://zenn.dev/shun_shobon/articles/173450f5bec890
  — 2025年**優勝者**の参加記。webpack-bundle-analyzerの活用、WebpackからViteへの載せ替え、巨大APIレスポンスの最適化、ffmpeg.wasmの除去など具体的な改善手順が詳細に記載

- https://trap.jp/post/2529/
  — 2025年5位（レギュ落ち）の参加記（traP）。バックエンド経験者がフロントエンド改善に挑んだ視点から記述

- https://zenn.dev/loxygenk/articles/flisan-web-speed-hackathon-2025
  — 2025年スコア10位の記録。IntersectionObserverによる無限スクロール実装、Rspackへの移行検討、VRTとの格闘などが詳細に書かれている

- https://a01sa01to.com/articles/2025/03/wsh2025/
  — 2025年の参加記（Asa）。事前のやることリスト作成、Webpack Analyzerの活用、フォントサブセット化、Cache-Control変更など時系列で改善を記録

- https://blog.u-naoki.com/posts/cyberagent-web-speed-hackathon-2025-report/
  — 2025年参加記。Webpack Bundle Analyzerでの解析、mode=production設定、inline sourcemap削除、ffmpeg.wasm除去、iconify jsonの最適化、APIレスポンスのネスト構造の修正など

- https://gist.github.com/mizchi/70bf18cb64ec965551a6bbd3806eb1c2
  — mizchi氏の2025年参加記録。fetchを上書きしてAPIメトリクスを取る手法、DevToolsのPerformanceでのCPUブロッキング監視、SSR化時のhydration問題など

- https://blog.p4ko.com/posts/webspeedhackathon2025/
  — 2025年の参加記（p4ko）

---

## 4. WSH 2024 参加記・上位入賞者のwriteup

- https://trap.jp/post/2170/
  — 2024年**優勝者**（cp20/traP）の参加記。改善の流れが詳細に記されており、過去問での練習方法から本番での戦略まで網羅

- https://blog.p1ass.com/posts/web-speed-hackathon-2024/
  — 2024年2位の参加記。「悪意を持って無駄に複雑になっているコードを読み解き、本当の意図を理解し直す」という改善の観点が参考になる

- https://a01sa01to.com/articles/2024/03/ca-wsh/
  — 2024年3位の参加記。事前準備のやることリストや、ReDoS対策、フォント周りの改善など

- https://trap.jp/post/2172/
  — 2024年参加記（mehm8128/traP）

- https://zenn.dev/tmikada/articles/web-speed-hackathon-2024
  — 2024年参加記。Viteドキュメント、過去のリポジトリ確認、Cursorの準備など事前準備のリソースが列挙されている

---

## 5. WSH 2023以前の参加記・解説

- https://zenn.dev/monica/articles/7e060938f72073
  — 2023年で3位になり損ねた話（sor4chi）。Cloudflare Pages + Functionsへの分離、CSS media queryへの置換など高度なテクニックを記載

- https://trap.jp/post/1772/
  — 2023年参加記（traP）。React未経験者がWSHに挑んだ体験記で、初心者目線での学びが記録されている

- https://note.com/yuta_ike/n/n4fe8ab292031
  — 2023年の問題を後日解いた備忘録。改善を分類してまとめており、Suspenseの活用やサーバー側JSONファイル設置などの手法を紹介

- https://zenn.dev/tmikada/articles/web-speed-hackathon-2023
  — 2023年参加記。初心者向けの心構えや進め方のアドバイスが充実

- https://trap.jp/post/1481/
  — 2021年miniで**ほぼ満点**を出した話（traP/sappi_red）。browserslistの設定、babel/postcssのトランスパイル最適化、polyfill除去、CSSへの置換など、理論的な改善プロセスが非常に詳細。**必読リファレンス**。

- https://zenn.dev/kii/articles/ca-speed-hack-herouku-node
  — 2020年過去問を使ったパフォーマンス学習の準備記事。環境構築手順と解説記事へのリンクがまとまっている

---

## 6. 過去問の戦略的解き方・まとめ

- https://zenn.dev/anko/scraps/4c752254ffc434
  — 2024年過去問を体系的に解いたスクラップ。Bundle Analyzerで120MB→0.39MBへの99.7%削減、画像のAVIF変換、lazy loadingなど具体的な手順を数値付きで記録

- https://speakerdeck.com/shuta13/li-dai-noweb-speed-hackathonnochu-ti-karakao-erudeguresinaipahuomansugai-shan
  — 歴代WSHの出題パターンから考えるデグレしないパフォーマンス改善のスライド。フォントサブセット化、不要CSSパージなどの定番テクニックを網羅

- https://blog.lai.so/web-speed-hackathon-2025-comming/
  — WSHの概要紹介記事。「フロントエンドエンジニア版のISUCON」としての位置づけ、SQLiteやSSR経路のNode.js処理など、フロントエンド以外のボトルネックについても言及

---

## 7. 一般的なWebパフォーマンス改善リソース

- https://web.dev/articles/optimize-vitals-lighthouse
  — Google公式。LighthouseとPageSpeed Insightsを使ったCore Web Vitalsの最適化手法を解説

- https://web.dev/articles/vitals-tools
  — Core Web Vitals改善のためのGoogleツール群のワークフロー解説。Lab dataとField dataの使い分けなど

- https://tech.travelbook.co.jp/posts/frontend_speedup/
  — Lighthouseスコアを50点以上改善した実践記。画像の遅延読み込み、Lighthouse計算ツールの活用法など、実務に即した改善プロセスが参考になる

- https://tech.smartcamp.co.jp/entry/how-to-improve-cwv-and-lighthouse-score
  — 2ヶ月でCore Web Vitals/Lighthouseスコアを大幅改善した記事。FCP、TTI、TBT、LCP、CLSの各指標の意味と改善方針が整理されている

---

## 8. 部内WSH・練習環境

- https://trap.jp/post/2388/
  — traP部内でWeb Speed Hackathonを開催した記録。自前で大会を開く方法やスコアリングツールの運用方法が記載

---

## コンテスト中のクイックリファレンスとしてのまとめ

WSHで繰り返し出題されるパフォーマンス改善のパターンは、過去の参加記を横断すると以下のようなものが多いです：

- **バンドルサイズ削減**: webpack-bundle-analyzer → 不要ライブラリ除去、tree shaking、code splitting
- **ビルド設定**: mode=production、sourcemap削除、minify有効化
- **バンドラ移行**: Webpack → Vite/Rspack（ビルド時間短縮＋最適化）
- **画像最適化**: AVIF/WebP変換、lazy loading、適切なサイズ指定
- **フォント最適化**: サブセット化、woff2変換、font-display: swap
- **不要な処理の除去**: ffmpeg.wasm等の巨大ライブラリ除去、polyfill不要化
- **API最適化**: 不要なネスト・冗長データの削減、N+1クエリの修正
- **CSSの最適化**: 不要CSS削除、JS→CSS置換（media query等）
- **キャッシュ戦略**: Cache-Control設定
- **レンダリング最適化**: SSR化、遅延読み込み、IntersectionObserver

特に2020年の公式解説Wiki（上記リンク）と2021年miniのほぼ満点記事（traP）は、体系的な知識が得られるので事前にぜひ目を通しておくことをお勧めします。頑張ってください！