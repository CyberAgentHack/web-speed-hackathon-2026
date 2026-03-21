# 30. /api/v1/me レンダリングブロック解除 & react-helmet 除去 (2026-03-21)

## 変更内容

### 1. /api/v1/me のレンダリングブロック解除
`AppContainer` で `/api/v1/me` のレスポンスを待つ間、全ページが白画面になっていた早期リターンを削除。ロード中は `activeUser=null` として即座にナビ+ルートを描画するように変更。

### 2. react-helmet → React 19 ネイティブ `<title>` に置換
全13ファイルから `react-helmet` の `<Helmet>` / `<HelmetProvider>` を除去し、React 19 の `<title>` に置換。

## 理由

- `/api/v1/me` が完了するまでナビゲーションもタイムラインfetchも開始されず、FCP/LCPが直撃していた
- `react-helmet` は React 19 では不要（`<title>` を直接JSXに書ける）

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/containers/AppContainer.tsx` | `isLoadingActiveUser` の早期リターン削除、`HelmetProvider`/`Helmet` import除去 |
| `client/src/containers/TimelineContainer.tsx` | `Helmet` → `<title>` |
| `client/src/containers/TermContainer.tsx` | 同上 |
| `client/src/containers/PostContainer.tsx` | 同上 |
| `client/src/containers/SearchContainer.tsx` | 同上 |
| `client/src/containers/DirectMessageContainer.tsx` | 同上 |
| `client/src/containers/DirectMessageListContainer.tsx` | 同上 |
| `client/src/containers/CrokContainer.tsx` | 同上 |
| `client/src/containers/NotFoundContainer.tsx` | 同上 |
| `client/src/containers/UserProfileContainer.tsx` | 同上 |
| `client/src/components/crok/CrokGate.tsx` | 同上 |
| `client/src/components/direct_message/DirectMessageGate.tsx` | 同上 |

## バンドルサイズ

- メインバンドル: 509KB → 508KB（微減）

## 計測

未計測
