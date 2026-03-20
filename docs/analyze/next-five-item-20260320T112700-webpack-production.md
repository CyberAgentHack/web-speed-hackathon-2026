# 対象項目

- webpack を「本番ビルドとして成立する設定」に戻す

# 読んだ docs

- `README.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `docs/development.md`
- `scoring-tool/README.md`

# 影響範囲

- `application/client/webpack.config.js`
- `application/client/babel.config.js`
- `application/client/package.json`
- ホーム初期表示の JS 配信量

# 実装前の仮説

- `NODE_ENV=development` と `mode: "none"` が残っており、最適化がほぼ無効だった。
- `core-js` / `regenerator-runtime` の常時注入と source map が、初期 JS を不必要に増やしていた。
- まず本番設定を成立させるだけでも、Lighthouse の unused JS と render-blocking は大きく改善する。

# 採用した方針

- webpack と Babel を現行 Chrome 前提の production に寄せる。
- tree shaking / minify / module concatenation / filesystem cache を有効化する。
- polyfill の常時注入と dev source map を外す。
- このコミットではまだ async chunk の有効化までは含めず、純粋に「本番ビルド化」だけを切り出す。

# 実装内容

- `application/client/package.json`
  - `build` / `analyze` から `NODE_ENV=development` を削除
- `application/client/babel.config.js`
  - `@babel/preset-env` を `last 2 Chrome versions` 向けへ変更
  - `modules: false`, `bugfixes: true`, `useBuiltIns: false`
  - React preset の `development: false`
- `application/client/webpack.config.js`
  - `mode: "production"`
  - `EnvironmentPlugin.NODE_ENV` を `production`
  - `minimize: true`
  - `concatenateModules`, `usedExports`, `providedExports`, `sideEffects` を有効化
  - `cache: { type: "filesystem" }`
  - `devtool: false`
  - `entry.main` から `core-js` と `regenerator-runtime/runtime` を削除

# 検証結果

- `mise x -- just build`: 成功
- `mise x -- just typecheck`: 成功
- 本コミット相当の状態では、`main.js` は約 71.8 MiB まで縮小したが、重い依存はまだ entry chunk に残った。
- そのため、初期表示改善には次の「遅延 import 化」が必須と判断した。

# スコア変化

- 事前 baseline
  - Lighthouse mobile score: `0.08`
  - `main.js`: 約 `108 MiB`
- 本項目だけの効果
  - `main.js`: 約 `71.8 MiB` まで減少
  - minify / source map 無効化 / legacy polyfill 除去の効果を確認

# リスクと未確認事項

- Chrome 前提へ寄せたため、旧ブラウザ互換性は意図的に落としている。
- ただし大会計測条件と README の推奨実行環境から、今回の最適化方針は妥当と判断した。
- まだ大きい wasm / AI / 変換系依存が main chunk に残る。

# 次にやるべきこと

- 一覧初期表示から重い機能依存を外し、route-level / feature-level の lazy import に寄せる。
- `public/` の巨大メディアと offscreen image を別途削減する。
