# PR振り返り — Web Speed Hackathon 2026

> 2026-03-20〜21 にマージした全PR（#40〜#84）のボトルネックと対策まとめ

---

## 目次

1. [ビルド・バンドル最適化](#1-ビルドバンドル最適化)
2. [アセット最適化（画像・動画・フォント）](#2-アセット最適化画像動画フォント)
3. [クライアント重処理のサーバーサイド移行](#3-クライアント重処理のサーバーサイド移行)
4. [レンダリング・UI最適化](#4-レンダリングui最適化)
5. [HTTP・キャッシュ最適化](#5-httpキャッシュ最適化)
6. [サーバー最適化](#6-サーバー最適化)
7. [バグ修正・デプロイ対応](#7-バグ修正デプロイ対応)
8. [時系列サマリー](#8-時系列サマリー)

---

## 1. ビルド・バンドル最適化

### PR #40: Tailwind CDN → npm ビルドタイム生成
| | |
|---|---|
| **ボトルネック** | Tailwind CSSがCDN経由でランタイム読み込みされており、FCP/LCPを遅延させていた |
| **対策** | PostCSS + Tailwind CSS をビルドタイムで処理し、必要なCSSのみを出力するよう変更 |
| **効果** | CDNリクエスト排除、未使用CSSのパージにより転送量削減 |

### PR #42: webpack mode:none → production / NODE_ENV 修正
| | |
|---|---|
| **ボトルネック** | webpack が `mode: "none"` で動作し、minification・tree shaking・scope hoisting が全て無効。`NODE_ENV=development` でReactの開発モード警告やチェックも有効 |
| **対策** | 環境に応じた動的設定（本番は `mode: "production"`, `NODE_ENV=production`）に変更 |
| **効果** | JSバンドルの大幅な圧縮・Tree Shakingによる不要コード除去 |

### PR #43 → #45 → #60: Webpack → Vite 移行（2回目で成功）
| | |
|---|---|
| **ボトルネック** | Webpack 5 + Babel 7（IE11ターゲット + CommonJS出力）で108MBの巨大バンドルが生成されていた |
| **対策** | PR #43で初回Vite移行→問題発覚しPR #45でRevert→PR #60で再度Vite + SWC移行を完了 |
| **効果** | JSバンドル: 108MB → ~13MB。ビルド時間も大幅短縮。ESM出力によりTree Shakingが効くように |

### PR #49 / #50: Webpack チャンク分割設定
| | |
|---|---|
| **ボトルネック** | splitChunks未設定で全コードが1つのバンドルに |
| **対策** | splitChunks設定を追加（設定値のクォート修正含む） |
| **効果** | 初期ロードに必要なJSのみ配信 |

### PR #61: チャンク分割の最適化
| | |
|---|---|
| **ボトルネック** | Vite移行後もチャンク分割が粗く、不要なコードが初期ロードに含まれていた |
| **対策** | manualChunks でベンダーライブラリを適切に分離（react, markdown, katex等） |
| **効果** | 初期ロードのJS量を削減 |

### PR #67: React Compiler 導入 + core-js/regenerator-runtime 削除
| | |
|---|---|
| **ボトルネック** | core-js の全量ポリフィル（モダンブラウザには不要）と regenerator-runtime が巨大。手動のuseMemo/useCallbackの最適化漏れ |
| **対策** | babel-plugin-react-compiler で自動メモ化を有効化。未使用の core-js, regenerator-runtime を削除 |
| **効果** | 不要ポリフィル除去によるバンドル削減 + 自動メモ化でリレンダリング抑制 |

### PR #69: createTranslator を動的インポートに変更
| | |
|---|---|
| **ボトルネック** | 翻訳機能（langs/json-repair-js/common-tags/@mlc-ai/web-llm）が初期バンドルに含まれていた |
| **対策** | 翻訳ボタンクリック時にのみ動的インポートするよう変更 |
| **効果** | 初期バンドルから大量のライブラリを除外 |

### PR #75: KaTeX チャンク(1.3MB)のホームページ初期ロード排除
| | |
|---|---|
| **ボトルネック** | Viteプリロードヘルパーが vendor-markdown チャンクに配置されていたため、KaTeX(1.3MB)が全ページで静的インポートされていた |
| **対策** | manualChunks でプリロードヘルパーを vendor-react チャンクに強制配置 + modulePreload: false |
| **効果** | ホームページ初期JS: **1,743KB → 389KB（78%削減）** |

---

## 2. アセット最適化（画像・動画・フォント）

### PR #46 / #54: 画像の WebP 変換・サイズ最適化
| | |
|---|---|
| **ボトルネック** | 画像アセット 89MB が無圧縮のまま配信されていた |
| **対策** | サーバーサイドで sharp を使い、画像を WebP 変換 + 800px幅リサイズするAPIエンドポイントを追加 |
| **効果** | 画像転送量の大幅削減 |

### PR #71: GIF動画 → MP4 変換
| | |
|---|---|
| **ボトルネック** | 15個のGIFファイル（合計179MB）をJSライブラリ（gifler/omggif）でデコードしCanvas描画していた。巨大転送量 + メインスレッド負荷 |
| **対策** | GIF → H.264 MP4(faststart) に変換。`<video autoPlay loop muted playsInline>` でブラウザネイティブ再生に置き換え |
| **効果** | **転送量: 179MB → 78MB（56%削減）**、gifler/omggifのJS除去、TBT改善 |

### PR #73: フォント OTF → WOFF2 サブセット化
| | |
|---|---|
| **ボトルネック** | 源ノ明朝フォント Regular(6.6MB) + Heavy(6.7MB) = 12.6MB が全グリフ含む OTF で配信されていた |
| **対策** | 利用規約ページで使われる96文字のみにサブセット化 + WOFF2変換 |
| **効果** | **12.6MB → 52KB（99.6%削減）** |

---

## 3. クライアント重処理のサーバーサイド移行

### PR #51: FFmpeg/ImageMagick WASM → サーバーサイド変換
| | |
|---|---|
| **ボトルネック** | FFmpeg WASM (~32MB) と ImageMagick WASM (~5MB) がクライアントバンドルに含まれ、ブラウザ上でメディア変換を実行していた |
| **対策** | サーバーサイドで ffmpeg-static + sharp による変換処理に置き換え |
| **効果** | バンドル ~37MB 削減（FCP/LCP改善）、ブラウザCPU負荷削減（TBT改善） |

### PR #78: 音声波形表示をサーバー側プリ計算に移行
| | |
|---|---|
| **ボトルネック** | クライアントがArrayBufferで音声ファイルをフェッチし、standardized-audio-context(16MB)でデコードして波形を描画していた |
| **対策** | サーバー側でffmpegベースの波形ピークス計算APIを追加。メモリ+ディスクキャッシュで高速応答。`<audio src>` で直接再生 |
| **効果** | standardized-audio-context(16MB)のインポート除去、メインスレッド負荷削減 |

### PR #80 / #82: NLP処理（kuromoji/negaposi/BM25）をサーバーサイドに移行
| | |
|---|---|
| **ボトルネック** | kuromoji（形態素解析）、negaposi-analyzer-ja（感情分析）、BM25（検索スコアリング）がクライアントバンドルに含まれ、メインスレッドで実行されていた |
| **対策** | サーバー側に `/api/v1/sentiment` エンドポイントと `/crok/suggestions?q=` フィルタリングを追加。TIFF画像のalt取得修正やDM送信修正も同時に実施 |
| **効果** | NLPライブラリのバンドル除去、TBT大幅改善 |

---

## 4. レンダリング・UI最適化

### PR #48: CoveredImage の blob URL 化を廃止（LCP 大幅改善）
| | |
|---|---|
| **ボトルネック** | 同期XHR(`async:false`)で画像バイナリを取得 → piexifjs で EXIF ALT 抽出 → image-size でアスペクト比計算 → blob URL 生成。全て同期処理でメインスレッドをブロック |
| **対策** | サーバーの最適化画像エンドポイントから800px幅WebPを直接 `<img src>` で配信。ALTはAPIレスポンスから取得。CSS `object-fit: cover` でトリミング |
| **効果** | **リソース読み込み遅延: 12,430ms → ほぼ 0ms** |

### PR #53: React.lazy でルートレベルのコード分割
| | |
|---|---|
| **ボトルネック** | 全ページのコンポーネントが1つのバンドルに同梱 |
| **対策** | React.lazy + Suspense でルートコンテナコンポーネントをコード分割 |
| **効果** | 初期ロードJS削減、各ページに必要なコードのみオンデマンド読み込み |

### PR #62: AspectRatioBox を CSS aspect-ratio に置き換え
| | |
|---|---|
| **ボトルネック** | JSで500msのsetTimeoutとresizeリスナーを使ってアスペクト比を計算。clientHeight !== 0 ガードで子要素の描画もブロック |
| **対策** | CSS `aspect-ratio` プロパティで即座にレイアウト確定 |
| **効果** | 500ms遅延除去、リフロー削減 |

### PR #77: Link の SPA 対応 + Crok ストリーミング高速化
| | |
|---|---|
| **ボトルネック** | `<a>` タグがフルページリロードを行い、ナビゲーション時に認証状態がロスト。Crokは3秒の不要sleep + 1文字ずつ10ms sleep で送信 |
| **対策** | React Router の client-side navigation に変更。Crok の3秒 sleep 削除、SSEチャンクを5文字ずつ1ms sleep に変更 |
| **効果** | ページ遷移の高速化、認証状態の維持、Crokレスポンス大幅高速化 |

### PR #83: Crok Markdown 再マウント問題修正
| | |
|---|---|
| **ボトルネック** | MarkdownRenderer に `key={content}` が設定されていたため、SSEストリーミング中にチャンク受信のたびにコンポーネントが完全再マウントされ、見出しがDOMに安定表示されなかった |
| **対策** | `key={content}` を削除 |
| **効果** | SSEストリーミング中のUI安定化 |

### PR #84: Redux / redux-form の完全除去
| | |
|---|---|
| **ボトルネック** | redux + react-redux + redux-form が約100KBのバンドルを占有。Store Provider ラッパーが初期レンダリングパスを複雑化 |
| **対策** | 全フォームを React useState ベースのネイティブフォームに移行。Store Provider wrapper を除去 |
| **効果** | バンドル ~100KB 削減、初期レンダリング簡素化 |

---

## 5. HTTP・キャッシュ最適化

### PR #47: HTTP ヘッダー最適化
| | |
|---|---|
| **ボトルネック** | `Cache-Control: max-age=0`、圧縮なし、ETag 無効で全リクエストがキャッシュなし・非圧縮 |
| **対策** | 適切な Cache-Control 設定、gzip/brotli 圧縮導入、ETag 有効化 |
| **効果** | リピートアクセスのネットワーク転送量大幅削減 |

---

## 6. サーバー最適化

### PR #63: サーバー起動最適化
| | |
|---|---|
| **ボトルネック** | サーバー起動時の処理が非効率 |
| **対策** | 起動処理の最適化（詳細不明、+311行） |
| **効果** | デプロイ後のサーバー応答開始を高速化 |

### PR #76: Sequelize コネクション競合修正
| | |
|---|---|
| **ボトルネック** | `POST /api/v1/initialize` で古いコネクションを先に閉じてから新しいものを作成していたため、間のリクエストが `ConnectionManager.getConnection was called after the connection manager was closed!` エラーで失敗 |
| **対策** | 新しいコネクション作成・モデル再バインドを先に行い、その後で古いコネクションを閉じるよう順序変更 |
| **効果** | initialize 直後のリクエスト失敗を解消、計測ツールの安定化 |

### PR #79: Default Scope の最適化
| | |
|---|---|
| **ボトルネック** | Post モデルの defaultScope で5テーブルの eager load JOIN が常時実行されていた |
| **対策** | 必要なときだけ eager load するよう変更 |
| **効果** | 不要なJOINの削減によるクエリ高速化 |

### PR #83（一部）: DM 作成の不要な JOIN 除去
| | |
|---|---|
| **ボトルネック** | `POST /dm` で defaultScope の5テーブルJOINが実行され、不要な reload() も呼ばれていた |
| **対策** | `unscoped()` で defaultScope をスキップ、reload() を削除 |
| **効果** | DM作成APIの応答高速化 |

---

## 7. バグ修正・デプロイ対応

### PR #52: jQuery → fetch API 置き換え
| | |
|---|---|
| **問題** | jQuery の `$.ajax()` が使われており、jQuery 全体がバンドルに含まれていた |
| **対策** | ネイティブ fetch API に全面置き換え |

### PR #55〜58: ビルド・デプロイ修正群
| PR | 問題 | 対策 |
|---|---|---|
| #55 | webpack が .json ファイルを解決できない | resolve extensions に .json を追加 |
| #56 | Docker環境で negaposi 辞書のダウンロードが失敗 | 辞書JSONをプロジェクト内に同梱 |
| #57 | lockfile と package.json の overrides 不整合で frozen-lockfile が失敗 | package.json に overrides を追加 |
| #58 | sqlite3/bcrypt のネイティブバイナリが Docker ビルドで生成されない | onlyBuiltDependencies を削除し pnpm-workspace.yaml の allowBuilds に統一 |

### PR #59: publicPath 修正
| | |
|---|---|
| **問題** | `publicPath: "auto"` だと `/posts/:id` 等のサブパスでリロード時にCSS/JSが404 |
| **対策** | `publicPath: "/"` に変更 |

### PR #70: 検索バリデーションエラー表示修正
| | |
|---|---|
| **問題** | 検索フォームのバリデーションエラーが画面に表示されない |
| **対策** | SubmissionError を導入し submitError もエラー表示対象に追加 |

### PR #72: 検索の ReDoS 脆弱性修正
| | |
|---|---|
| **問題** | `parseSearchQuery` の正規表現 `((\\d\|\\d\\d\|\\d\\d\\d\\d-\\d\\d-\\d\\d)+)+$` が ReDoS 脆弱。計測ツールが `"0".repeat(20) + "x"` でテストするためメインスレッドがフリーズ |
| **対策** | 安全な正規表現パターン `/^\\d{4}-\\d{2}-\\d{2}$/` に置換 |

### PR #74: DM送信・画像投稿フローの計測失敗修正
| | |
|---|---|
| **問題** | モーダルを閉じずに navigate() していたため DM スレッドへの遷移が検出されない。TIFF画像のalt属性がAPIレスポンスに含まれていない |
| **対策** | `ref.current?.close()` を追加。convertImage の戻り値に alt を追加 |

### PR #81: waveform 一時ディレクトリ作成修正
| | |
|---|---|
| **問題** | Fly.io 環境で `/app/.cache/` が存在せず mkdtemp が ENOENT で失敗 |
| **対策** | CACHE_PATH の mkdir を事前に実行 |

---

## 8. 時系列サマリー

```
3/20 02:30  #40  Tailwind CDN → ビルドタイム
     02:51  #41  CLAUDE.md 追加
     03:11  #42  webpack mode:production + NODE_ENV
     03:27  #43  Webpack → Vite 移行（初回）
     04:10  #45  ↑ Revert
     04:36  #46  画像 WebP 変換
     05:13  #47  HTTP ヘッダー最適化
     05:36  #48  CoveredImage blob URL 廃止（LCP -12秒）
     05:56  #49  Webpack チャンク分割
     05:57  #50  ↑ 設定修正
     07:39  #52  jQuery → fetch
     07:59  #53  React.lazy コード分割
     08:41  #51  WASM→サーバーサイド変換
     08:53  #54  画像サイズ最適化
     10:13  #55  webpack .json 解決
     10:23  #56  negaposi辞書バンドル
     10:36  #57  pnpm overrides修正
     12:10  #58  sqlite3ネイティブビルド復旧
     13:08  #59  publicPath修正
     13:30  #60  Webpack → Vite 移行（成功）
     14:05  #61  チャンク分割最適化
     14:16  #62  AspectRatioBox → CSS
     15:33  #63  サーバー起動最適化

3/21 01:43  #67  React Compiler + polyfill削除
     01:44  #68  ホームLCP遅延修正
     01:44  #69  翻訳動的インポート
     02:57  #70  検索バリデーション修正
     03:33  #71  GIF → MP4（179MB→78MB）
     04:06  #72  ReDoS脆弱性修正
     04:35  #73  フォントWOFF2化（12.6MB→52KB）
     05:04  #74  DM・画像投稿修正
     05:30  #75  KaTeX初期ロード排除（1.7MB→389KB）
     05:44  #76  Sequelizeコネクション修正
     06:48  #77  SPA対応 + Crok高速化
     07:01  #78  音声波形サーバー移行
     07:39  #79  defaultScope最適化
     07:41  #80  NLP処理サーバー移行
     07:49  #81  waveform mkdir修正
     08:02  #82  NLP追加修正
     08:07  #83  Crok再マウント修正 + DM JOIN除去
     08:08  #84  Redux/redux-form除去
```

---

## インパクトランキング

| 順位 | PR | 施策 | 削減効果 |
|---|---|---|---|
| 1 | #73 | フォント WOFF2 サブセット化 | 12.6MB → 52KB (99.6%削減) |
| 2 | #75 | KaTeX 初期ロード排除 | ホームJS 1,743KB → 389KB (78%削減) |
| 3 | #71 | GIF → MP4 変換 | 179MB → 78MB (56%削減) |
| 4 | #51 | WASM → サーバーサイド | バンドル ~37MB 削減 |
| 5 | #48 | CoveredImage 最適化 | LCP 12,430ms → ~0ms |
| 6 | #60 | Vite 移行 | JSバンドル 108MB → ~13MB |
| 7 | #78 | 音声波形サーバー移行 | 16MB インポート除去 |
| 8 | #80 | NLP サーバー移行 | TBT 大幅改善 |
| 9 | #84 | Redux 除去 | ~100KB 削減 + レンダリング改善 |
| 10 | #47 | HTTP ヘッダー最適化 | リピートアクセス全般改善 |
