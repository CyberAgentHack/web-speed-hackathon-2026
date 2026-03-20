# 024-foundation/LinkをReact RouterのLinkに変更してSPAナビゲーションにする

## 問題

SPAであるにもかかわらず、画面遷移のたびにページ全体がフルリロードされる。

## 原因

`application/client/src/components/foundation/Link.tsx` が React Router の `<Link>` ではなく素の `<a href>` タグを使っている。
`useHref` でパスを生成した後、素の `<a>` タグとして描画しているため、クリック時にブラウザのデフォルトナビゲーション（フルページリロード）が発生する。

## 影響箇所

この `foundation/Link` は以下のコンポーネントで使用されており、全てフルリロードになっている:
- `NavigationItem.tsx` — サイドナビゲーション全体
- `PostItem.tsx` — 投稿内のユーザーリンク・日時リンク
- `CommentItem.tsx` — コメント内のユーザーリンク
- `DirectMessageListPage.tsx` — DM一覧の各会話へのリンク
- `AuthModalPage.tsx` — 認証モーダル内のリンク

なお `TimelineItem.tsx` は `react-router` の `Link` を直接importしており問題なし。

## 修正方針

`foundation/Link.tsx` で `react-router` の `Link` コンポーネントをラップする形に変更する。

## 修正対象

- `application/client/src/components/foundation/Link.tsx`

## 期待効果

- TBT/FCP/LCP の改善（フルリロードが不要になるため）
- ユーザー体験の向上（画面遷移が高速になる）

## 検証

1. 型チェック通過
2. 開発サーバーでナビゲーション操作時にフルリロードが発生しないことを確認
3. VRT通過
