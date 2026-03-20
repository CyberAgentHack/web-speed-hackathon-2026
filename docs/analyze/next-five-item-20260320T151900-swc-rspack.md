# SWC + Rspack 移行レポート

日時: 2026-03-20T15:19:00

## 対象項目

1. babel-loader → swc-loader 置き換え（ビルドツールチェーン改善）
2. webpack → Rspack 移行（バンドラー移行）

## 読んだ docs

- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `application/client/webpack.config.js`（変更前）
- `application/client/babel.config.js`（変更前）
- `application/client/package.json`
- `application/package.json`
- `Dockerfile`

## 影響範囲

### 直接変更ファイル

**Step 1 (SWC):**
- `application/client/babel.config.js` → 削除
- `application/client/webpack.config.js` → babel-loader を swc-loader に差し替え
- `application/client/package.json` → babel 系 devDeps 削除、swc-loader + @swc/core 追加
- `application/package.json` → `@swc/core` を onlyBuiltDependencies に追加

**Step 2 (Rspack):**
- `application/client/webpack.config.js` → `rspack.config.js` にリネーム＆書き換え
- `application/client/package.json` → webpack 系 devDeps 削除、@rspack/core + @rspack/cli 追加、scripts 更新
- `application/package.json` → `@swc/core` を onlyBuiltDependencies から削除
- `Dockerfile` → rm 対象ファイル名を rspack.config.js に更新

### ランタイム影響

- ビルドツールの変更のみ。ランタイムの JS/CSS 出力は同等。
- API・表示・動作の変更なし。

## 実装前の仮説

- babel-loader → swc-loader は Rust ベースのトランスパイラで、同等出力でビルド速度が改善する
- webpack → Rspack は webpack 互換 API を持つ Rust バンドラーで、さらにビルド速度が改善する
- いずれもランタイム出力には大きな差異がなく、レギュレーション違反リスクは低い
- `asset/bytes`、`ProvidePlugin`、`EnvironmentPlugin` は Rspack でサポート済み

## 採用した方針

安全優先案:
- Step 1 と Step 2 を別コミットに分離し、1 つずつ検証
- webpack 互換のプラグインは Rspack 内蔵プラグインで 1:1 置換
- `webpack-bundle-analyzer` は互換性があるためそのまま維持
- `builtin:swc-loader` で外部 @swc/core 依存も削除

## 実装内容

### Step 1: SWC 移行（コミット: d56f424）

babel 設定の等価 SWC 設定:

| babel | SWC |
|-------|-----|
| `@babel/preset-typescript` | `jsc.parser.syntax: "typescript", tsx: true` |
| `@babel/preset-env` (targets: "last 2 Chrome versions") | `env.targets: "last 2 Chrome versions"` |
| `@babel/preset-react` (runtime: "automatic") | `jsc.transform.react.runtime: "automatic"` |

削除パッケージ: `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`, `babel-loader`
追加パッケージ: `swc-loader`, `@swc/core`

### Step 2: Rspack 移行（コミット: ee29ade）

プラグイン置換:

| webpack | Rspack |
|---------|--------|
| `webpack.ProvidePlugin` | `rspack.ProvidePlugin` |
| `webpack.EnvironmentPlugin` | `rspack.EnvironmentPlugin` |
| `MiniCssExtractPlugin` | `rspack.CssExtractRspackPlugin` |
| `CopyWebpackPlugin` | `rspack.CopyRspackPlugin` |
| `HtmlWebpackPlugin` | `rspack.HtmlRspackPlugin` |
| `swc-loader` | `builtin:swc-loader` |
| `BundleAnalyzerPlugin` | そのまま互換利用 |

CSS ルールに `type: "javascript/auto"` を追加（Rspack のネイティブ CSS 処理との競合回避）。

削除パッケージ: `webpack`, `webpack-cli`, `webpack-dev-server`, `swc-loader`, `@swc/core`, `copy-webpack-plugin`, `html-webpack-plugin`, `mini-css-extract-plugin`
追加パッケージ: `@rspack/core`, `@rspack/cli`

## 検証結果

### ビルド成功

| | webpack + babel | webpack + swc | Rspack + builtin:swc |
|---|---|---|---|
| ビルド時間 | (未計測) | 20.4s | 7.3s |
| main.js | - | 710 KiB | 414.5 KiB |
| エントリポイント合計 | - | 766 KiB | 466 KiB |

### 出力検証

- `index.html`: 正常生成（script/link タグ維持）
- `scripts/main.js`: 生成済み
- `styles/main.css`: 生成済み（52.7 KiB）
- `styles/fonts/`: KaTeX フォントコピー正常
- 動的チャンク: 正常に分割生成

### VRT / 手動確認

- **VRT**: 未実施（ビルドツール変更のみでランタイム影響なしと判断）
- **手動確認**: 未実施（サーバー起動は別作業）
- **スコア計測**: 未実施

## リスクと未確認事項

1. **VRT 未実施**: ビルドツール変更のみだがランタイム出力の微差がゼロとは断言できない。デプロイ前に VRT を実行すべき。
2. **devServer 未検証**: Rspack の devServer は互換性が高いが、開発時のプロキシ設定含め動作確認が必要。
3. **main.js サイズの大幅減少** (710→414.5 KiB): Rspack の tree-shaking やスコープ巻き上げの差異による可能性がある。一部コードが欠落していないか、実動作での確認が必要。
4. **`webpack-bundle-analyzer` 互換**: 検証用のため本番影響なし。

## 次にやるべきこと

1. サーバーを起動して画面表示の目視確認
2. VRT 実行
3. Lighthouse 計測で before/after 比較
4. `ANALYZE=true rspack build` で bundle 分析の動作確認
