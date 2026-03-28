# 08 SPA Link and Layout Observer Optimization

## 背景

- `Link` が素の `<a>` 実装だったため、同一アプリ内遷移でもフルリロードが起きる余地があった。
- `AspectRatioBox` が `setTimeout(500)` + `window.resize` でサイズ計算しており、初期遅延と再計算負荷があった。

## 実施内容

- `application/client/src/components/foundation/Link.tsx`
  - 実装を `react-router` の `Link` に差し替え
  - SPA遷移を維持しつつ既存 `to` インターフェースを踏襲
- `application/client/src/components/foundation/AspectRatioBox.tsx`
  - `setTimeout(500)` を廃止
  - `ResizeObserver` ベースに変更し、要素サイズ変化時のみ再計算
  - 初回 `calcStyle()` を即時実行して遅延レンダリングを最小化

## 影響範囲

- ナビゲーションリンク全般
- 画像/動画/音声コンテナのアスペクト維持レイアウト

## リスクと対策

- リスク: `ResizeObserver` 非対応ブラウザでの挙動
- 対策: 競技要件が Chrome 最新版のため要件内

## 検証結果

- `pnpm --dir application/client exec tsc --noEmit` 成功
- ローカル採点計測は方針により未実施
