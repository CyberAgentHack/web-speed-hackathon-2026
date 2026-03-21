# 30. /api/v1/me レンダリングブロック解除 & react-helmet 除去 (2026-03-21)

## 変更内容

### 1. /api/v1/me のレンダリングブロック解除
`AppContainer` で `/api/v1/me` のレスポンスを待つ間、全ページが白画面になっていた早期リターンを削除。ロード中は `activeUser=null` として即座にナビ+ルートを描画するように変更。

### 2. react-helmet → useDocumentTitle フックに置換
全13ファイルから `react-helmet` の `<Helmet>` / `<HelmetProvider>` を除去。React 19 の `<title>` JSXはSuspense内で正しく動作しなかったため、`useDocumentTitle` カスタムフック（`document.title` を `useEffect` で設定）を作成して置換。

## 理由

- `/api/v1/me` が完了するまでナビゲーションもタイムラインfetchも開始されず、FCP/LCPが直撃していた
- `react-helmet` は React 19 では不要だが、`<title>` JSXはlazy/Suspense内で動作しなかったため `useDocumentTitle` フックで対応

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/containers/AppContainer.tsx` | `isLoadingActiveUser` の早期リターン削除、`HelmetProvider`/`Helmet` import除去 |
| `client/src/hooks/use_document_title.ts` | 新規作成 |
| `client/src/containers/TimelineContainer.tsx` | `Helmet` → `useDocumentTitle` |
| `client/src/containers/TermContainer.tsx` | 同上 |
| `client/src/containers/PostContainer.tsx` | 同上（条件分岐対応） |
| `client/src/containers/SearchContainer.tsx` | 同上 |
| `client/src/containers/DirectMessageContainer.tsx` | 同上（条件分岐対応） |
| `client/src/containers/DirectMessageListContainer.tsx` | 同上 |
| `client/src/containers/CrokContainer.tsx` | 同上 |
| `client/src/containers/NotFoundContainer.tsx` | 同上 |
| `client/src/containers/UserProfileContainer.tsx` | 同上（条件分岐対応） |
| `client/src/components/crok/CrokGate.tsx` | `<title>` 削除（親で設定済み） |
| `client/src/components/direct_message/DirectMessageGate.tsx` | 同上 |

## 計測

未計測
