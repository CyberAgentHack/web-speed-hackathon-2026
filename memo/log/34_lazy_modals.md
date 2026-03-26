# 34. AuthModal/NewPostModalのlazy化 (2026-03-21)

## 変更内容

`AuthModalContainer` と `NewPostModalContainer` を `React.lazy` による動的importに変更。

## 理由

両コンポーネントが静的importされていたため、redux-form、FFmpeg参照、ImageMagick参照などが初期バンドルに含まれていた。モーダルはユーザー操作で初めて表示されるため、初期ロードには不要。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/containers/AppContainer.tsx` | 静的import → `lazy()` + `Suspense` に変更 |

## バンドルサイズ

- メインバンドル: 508KB → **229KB**（55%削減）

## 計測

未計測
