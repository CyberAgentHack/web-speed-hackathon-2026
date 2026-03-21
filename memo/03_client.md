# クライアント調査

## 構成

- **フレームワーク**: React 19.2.0 + Redux 5.0.1 + React Router 7.9.4
- **ビルド**: Webpack 5.102.1 + Babel (target: IE 11)
- **フォーム**: redux-form 8.3.10 (非推奨)
- **HTTP**: jQuery (async: false!) + jquery-binarytransport
- **CSS**: Tailwind CSS 4.2.1 (CDN/ブラウザJIT) + PostCSS

## ルーティング

| パス                | コンテナ                   | 説明                          |
| ------------------- | -------------------------- | ----------------------------- |
| /                   | TimelineContainer          | タイムライン (無限スクロール) |
| /search             | SearchContainer            | 検索                          |
| /users/:username    | UserProfileContainer       | ユーザープロフィール          |
| /posts/:postId      | PostContainer              | 投稿詳細                      |
| /dm                 | DirectMessageListContainer | DM一覧                        |
| /dm/:conversationId | DirectMessageContainer     | DM詳細                        |
| /terms              | TermContainer              | 利用規約                      |
| /crok               | CrokContainer              | AIチャット                    |

## 主要ライブラリ (バンドル肥大化要因)

- **メディア処理**: @ffmpeg/ffmpeg, @imagemagick/magick-wasm, gifler, omggif
- **AI/NLP**: @mlc-ai/web-llm (gemma-2-2b), kuromoji, negaposi-analyzer-ja, bayesian-bm25
- **レガシー**: jQuery, bluebird, moment, lodash
- **レンダリング**: katex, react-markdown, react-syntax-highlighter

## パフォーマンス問題

### P0 (超重大)

1. **Webpack最適化すべてOFF**
   - minimize: false, splitChunks: false, concatenateModules: false
   - usedExports: false (Tree Shaking無効)
   - cache: false, devtool: "inline-source-map"
   - mode: "none"
     → バンドルが巨大な単一ファイルに

2. **jQuery async: false (同期AJAX)**
   - fetchers.ts の全4箇所で `async: false`
   - メインスレッドを完全ブロック
     → TTI/TBT 壊滅的

3. **フォント13MB (OTF, font-display: block)**
   - ReiNoAreMincho-Regular.otf (6.4MB)
   - ReiNoAreMincho-Heavy.otf (6.4MB)
     → FCP大幅遅延

4. **メディアのブロッキング全量読み込み**
   - 画像: fetchBinaryで6016x4016 JPGを全取得
   - GIF: 最大26MB/ファイルをメモリに全読み込み
   - 音声: MP3全体をメモリに読み込み
     → LCP遅延、メモリ爆発

5. **画像/動画フォーマット非最適化**
   - 画像: JPGのみ (WebP未使用, レスポンシブなし)
   - 動画: GIF (MP4/WebM未使用, 180MB)
     → 帯域の85%以上が無駄

### P1 (重大)

6. **無限スクロール検出で2^18ループ**
   - InfiniteScroll.tsx: `Array.from(Array(2**18), ...)` = 262,144回/イベント
     → scrollイベントごとにCPU浪費

7. **Tailwind CSS CDN (ブラウザJIT)**
   - `<script src="cdn.jsdelivr.net/.../browser@4.2.1">`
   - 毎回ブラウザでCSSコンパイル
     → FCP遅延

8. **レガシーライブラリ**
   - jQuery (~90KB), moment (~300KB), lodash (~70KB full)
   - bluebird, core-js, regenerator-runtime
     → 不要な~1MBのバンドル肥大

9. **Babel target: IE 11**
   - 不要なポリフィル大量注入
   - commonjsモジュール出力

### P2 (中程度)

10. **コンポーネントmemo/lazy未使用** - 全再レンダリング
11. **FFmpeg/ImageMagick WASM** - 投稿時に数十MB読み込み
12. **web-llm** - AIチャット初回で数百MBモデルDL
13. **kuromoji辞書** - 検索初回で18MB読み込み
14. **ソースマップ本番配信** - inline-source-map
