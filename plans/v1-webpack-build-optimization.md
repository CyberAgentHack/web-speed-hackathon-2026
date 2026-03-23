# v1: webpack ビルド最適化

## Context

現在 `main.js` が **108MB** で配信されている。
これは webpack / Babel の設定が意図的に全て無効化されているためである。
このステップでは、**コードの動作ロジックを一切変更せず**、ビルド設定のみを修正してバンドルサイズを劇的に削減する。

**目標**: main.js を 108MB → 数MB に削減し、Lighthouse のページ表示スコアを 300 点以上にする。

## なぜ webpack 設定から着手するのか

パフォーマンスの問題は大きく2つに分けられる:

1. **転送サイズ** — ブラウザがダウンロードするファイルの大きさ
2. **実行コスト** — ブラウザがダウンロードした JS を解析・実行する時間

現在の 108MB の main.js は両方の問題を同時に引き起こしている。
webpack 設定を修正するだけで、コードの動作を変えずにバンドルサイズを劇的に削減できる。
つまり **「機能落ちリスクが最も低く、効果が最も大きい」** 最初の一手である。

## 修正内容

### 1. `application/client/webpack.config.js`

#### mode の変更

```js
// Before
mode: "none",

// After
mode: "production",
```

**意味**: webpack に「本番用のビルドを行う」と伝える。
これにより webpack 内部で DefinePlugin (`process.env.NODE_ENV = "production"`) や各種最適化フラグが自動で有効になる。

#### devtool の変更

```js
// Before
devtool: "inline-source-map",

// After
devtool: false,
```

**意味**: `inline-source-map` はソースマップをバンドル内に埋め込む設定。
main.js の 108MB のうち約 90MB がこのソースマップ。`false` にすることでソースマップ自体を生成しない。
(デバッグが必要な場合は `"hidden-source-map"` で別ファイルとして出力することも可能)

#### optimization の変更

```js
// Before
optimization: {
  minimize: false,          // ミニファイ無効
  splitChunks: false,       // コード分割無効
  concatenateModules: false,// モジュール連結無効
  usedExports: false,       // tree-shaking 無効
  providedExports: false,   // エクスポート解析無効
  sideEffects: false,       // 副作用解析無効
},

// After
optimization: {
  minimize: true,           // ミニファイ有効 → 変数名短縮、空白削除、到達不能コード削除
  splitChunks: false,       // コード分割は Step 2 以降で実施 (機能影響を最小化)
  concatenateModules: true, // モジュール連結有効 → wrapper 関数のオーバーヘッド削減
  usedExports: true,        // tree-shaking 有効 → 未使用エクスポートにマーク付与
  providedExports: true,    // エクスポート解析有効 → tree-shaking の精度向上
  sideEffects: true,        // 副作用解析有効 → 副作用のないモジュールを安全に削除
},
```

| 設定 | 効果 |
|------|------|
| `minimize: true` | TerserPlugin がコードを圧縮 (変数名短縮、空白削除、デッドコード削除) |
| `concatenateModules: true` | 複数モジュールを1つにまとめてラッパー関数のオーバーヘッドを削減 |
| `usedExports: true` | 使われていないエクスポートに `/* unused */` マークを付け、minifier が削除 |
| `providedExports: true` | 各モジュールが何をエクスポートしているかを正確に追跡 |
| `sideEffects: true` | package.json の `sideEffects` フィールドを参照して不要モジュールを削除 |

#### cache の削除

```js
// Before
cache: false,

// After
// (削除 — production モードのデフォルトに任せる)
```

**意味**: `false` だとビルドキャッシュが使われない。削除すると production デフォルトの最適なキャッシュ戦略が適用される。

#### EnvironmentPlugin の変更

```js
// Before
new webpack.EnvironmentPlugin({
  NODE_ENV: "development",
})

// After
new webpack.EnvironmentPlugin({
  NODE_ENV: "production",
})
```

**意味**: コード中の `process.env.NODE_ENV` が `"production"` に置換される。
React は `process.env.NODE_ENV !== "production"` で囲まれた開発用の警告コード・チェックコードを持っており、
`"production"` に設定すると minifier がこれらを到達不能コードとして削除する。

### 2. `application/client/babel.config.js`

#### @babel/preset-env の変更

```js
// Before
["@babel/preset-env", {
  targets: "ie 11",        // IE 11 向けトランスパイル
  corejs: "3",
  modules: "commonjs",     // ES modules → CommonJS 変換
  useBuiltIns: false,
}],

// After
["@babel/preset-env", {
  targets: "defaults",     // モダンブラウザ向け
  corejs: "3",
  modules: false,          // ES modules をそのまま維持
  useBuiltIns: false,
}],
```

| 設定 | Before | After | 効果 |
|------|--------|-------|------|
| `targets` | `"ie 11"` | `"defaults"` | IE 11 向けの大量のトランスパイル (アロー関数→function、テンプレートリテラル→文字列結合 等) が不要になる |
| `modules` | `"commonjs"` | `false` | **最重要**。ES modules (`import/export`) をそのまま webpack に渡すことで、webpack が静的解析でき tree-shaking が有効になる。`"commonjs"` だと `require()` に変換されてしまい、webpack は何が使われているか判定できない |

#### @babel/preset-react の変更

```js
// Before
["@babel/preset-react", {
  development: true,       // React 開発モード
  runtime: "automatic",
}],

// After
["@babel/preset-react", {
  development: false,      // React 本番モード
  runtime: "automatic",
}],
```

**意味**: `development: true` だと React の JSX 変換に開発用のデバッグ情報 (コンポーネント名、ソース位置) が含まれる。
`false` にすることでこれらが省かれ、バンドルサイズが減る。

### 3. `application/client/package.json`

```json
// Before
"build": "NODE_ENV=development webpack"

// After
"build": "NODE_ENV=production webpack"
```

**意味**: シェル環境変数レベルでも `NODE_ENV=production` を設定。
webpack.config.js の EnvironmentPlugin と合わせて確実に production モードで動作させる。

## このステップで変更しないもの (意図的に据え置き)

| 項目 | 理由 |
|------|------|
| `splitChunks: false` → コード分割 | 動作影響が大きいため段階的に Step 2 以降で実施 |
| エントリの `core-js` 全量読み込み | polyfill 削減は Step 2 以降 |
| 重量ライブラリ置き換え (moment, lodash 等) | コード変更を伴うため Step 3 以降 |
| Backend の圧縮・キャッシュ設定 | Frontend と独立しているため Step 2 以降 |

## 想定される効果

| 指標 | Before | After (予測) |
|------|--------|-------------|
| main.js サイズ | 108 MB | 3-8 MB |
| FCP | 90.3 秒 | 数秒〜10 秒台 |
| ページ表示合計 | 288.25 / 900 | 300 点超え (ユーザーフロー計測が解放) |

## 機能影響リスク

**低リスク** — コードの動作ロジックは変更しない。変わるのは:

- minify による変数名短縮 (動作に影響なし)
- tree-shaking による未使用コード削除 (使われていないコードが消えるだけ)
- React が本番モードで動作 (開発警告が出なくなるだけ)
- IE 11 向けトランスパイルが減る (Google Chrome 最新版では問題なし)

**注意点:**

- `sideEffects: true` により、副作用のあるモジュールが誤って削除される可能性がある → ビルド後に VRT で確認
- `modules: false` への変更で、CommonJS 前提のコードがあればエラーになる可能性 → ビルドエラーで即座に検知

## 検証手順

```bash
# 1. ビルド
cd application && pnpm run build
ls -lh dist/scripts/main.js   # サイズが大幅に縮小していること

# 2. サーバー起動・動作確認
pnpm run start
# http://localhost:3000/ が正常に表示されること

# 3. DB 初期化
curl -X POST http://localhost:3000/api/v1/initialize

# 4. パフォーマンス計測
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000
# 結果を performance/scoring_tool/ に保存

# 5. VRT
cd application/e2e && pnpm run test:update
# 全テストが passed であること
```
