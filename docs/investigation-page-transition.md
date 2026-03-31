# ページ遷移の待ち時間調査レポート

## 調査概要

ページ遷移時に無駄な待ち時間が発生していないかを調査した。結果、**5つの重大なボトルネック**を特定した。

---

## 問題 1: フルページリロードによるクライアント遷移の喪失

**ファイル:** `application/client/src/components/foundation/Link.tsx`

```tsx
// 現状: 通常の <a> タグでフルリロードが走る
export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  const href = useHref(to);
  return <a ref={ref} href={href} {...props} />;
});
```

### 問題点
- React Router の `useHref` で URL を生成しているが、レンダリングは通常の `<a>` タグ
- クリックするたびに**ブラウザがページ全体をリロード**する
- SPA としてのクライアントサイドルーティングが機能していない
- リロードのたびに JS バンドル全体の再パース・再実行、React ツリーの再構築、全 API の再取得が走る

### 影響度: **致命的**

すべての内部リンクでフルリロードが発生するため、遷移のたびに以下の待ち時間が加算される:
1. HTML の再ダウンロード
2. JS バンドルの再ダウンロード・パース・実行
3. `window.load` イベント待ち（問題2）
4. `/api/v1/me` 取得待ち（問題4）
5. 各ページ固有の API 取得

### 修正方針
- `Link` コンポーネントを React Router の `<Link>` を使ったクライアント遷移に変更する

---

## 問題 2: `window.load` イベント待ちによるレンダリング遅延

**ファイル:** `application/client/src/index.tsx`

```tsx
// 現状: load イベントまで React のマウントを遅延
window.addEventListener("load", () => {
  createRoot(document.getElementById("app")!).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
});
```

### 問題点
- `window.load` は**すべてのリソース（画像・フォント・CSS 等）のダウンロード完了**を待つ
- DOM の準備完了（`DOMContentLoaded`）よりも大幅に遅い
- React のマウントが不必要に遅延し、ユーザーは白画面を見せられる

### 影響度: **高**

フルリロード（問題1）と組み合わさると、遷移のたびに全リソースの再読み込み完了まで何も表示されない。

### 修正方針
- `window.addEventListener("load", ...)` を削除し、即座に `createRoot` を実行する
- script タグに `defer` を付けて DOM パース完了後に実行する方式でも可

---

## 問題 3: 同期 AJAX (`async: false`) によるメインスレッドブロック

**ファイル:** `application/client/src/utils/fetchers.ts`

```tsx
// 全関数で async: false が指定されている
export async function fetchJSON<T>(url: string): Promise<T> {
  const result = await $.ajax({
    async: false,  // ← メインスレッドを完全にブロック
    dataType: "json",
    method: "GET",
    url,
  });
  return result;
}
```

### 問題点
- `async: false` は **XMLHttpRequest を同期モードで実行**する
- レスポンスが返るまでメインスレッドが完全にブロックされ、UI が固まる
- `fetchJSON`, `fetchBinary`, `sendFile`, `sendJSON` の**全4関数**に設定されている
- 関数シグネチャは `async` だが、中身は同期実行なので `await` しても並列化できない
- jQuery に依存しており、バンドルサイズも増加させている

### 影響度: **致命的**

ページ遷移後の API 取得が同期実行されるため:
- API レスポンスが返るまで画面が完全にフリーズする
- 複数 API を呼ぶページでは、各リクエストが直列・同期で実行される
- ユーザー操作（スクロール・クリック等）を一切受け付けない

### 修正方針
- jQuery を廃止し、`fetch` API ベースの非同期通信に置き換える
- `async: false` を削除して完全な非同期通信にする

---

## 問題 4: `/api/v1/me` 完了まで全画面をブロックする初期化

**ファイル:** `application/client/src/containers/AppContainer.tsx`

```tsx
const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);

useEffect(() => {
  void fetchJSON<Models.User>("/api/v1/me")
    .then((user) => setActiveUser(user))
    .finally(() => setIsLoadingActiveUser(false));
}, []);

// ロード中は「読込中 - CaX」のみ表示
if (isLoadingActiveUser) {
  return (
    <HelmetProvider>
      <Helmet><title>読込中 - CaX</title></Helmet>
    </HelmetProvider>
  );
}
```

### 問題点
- `/api/v1/me` の取得完了まで、**ルーティングもページコンテンツも一切レンダリングしない**
- 認証状態に依存しないページ（トップ、検索、投稿詳細、利用規約）も待たされる
- フルリロード（問題1）と組み合わさると、遷移のたびにこの待ちが毎回発生する
- さらに `fetchJSON` が同期実行（問題3）なので、この間 UI が完全にフリーズする

### 影響度: **高**

ページ遷移 → フルリロード → load 待ち → `/api/v1/me` 同期取得 → ようやくページ描画、という**四重のウォーターフォール**を形成している。

### 修正方針
- 認証状態を `loading | authenticated | guest` の3状態で管理する
- ロード中もルーティングとページコンテンツを表示する（認証必須ページのみゲートを設ける）
- または、認証取得を非ブロッキングにして並行でページを描画する

---

## 問題 5: InfiniteScroll の 2^18 回ループと全件取得

### 5a. 26万回の無意味なループ

**ファイル:** `application/client/src/components/foundation/InfiniteScroll.tsx`

```tsx
const handler = () => {
  // 念の為 2の18乗 回、最下部かどうかを確認する
  const hasReached = Array.from(Array(2 ** 18), () => {
    return window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
  }).every(Boolean);
  // ...
};

document.addEventListener("wheel", handler, { passive: false });
document.addEventListener("touchmove", handler, { passive: false });
document.addEventListener("resize", handler, { passive: false });
document.addEventListener("scroll", handler, { passive: false });
```

**問題点:**
- `2 ** 18 = 262,144` 回、**まったく同じ判定**を繰り返している（結果は毎回同じ）
- 262,144 要素の配列生成 + DOM プロパティの読み取りが毎イベントで発生
- `passive: false` なのでスクロール最適化（compositor thread でのスクロール）が無効化される
- `wheel`, `touchmove`, `resize`, `scroll` の4イベントすべてに登録されている

**影響度: 高** — スクロール系イベントは高頻度で発火するため、ページ遷移後のスクロールや `scrollTo(0,0)` でもメインスレッドが詰まる。

### 5b. 全件取得 + クライアントサイドスライス

**ファイル:** `application/client/src/hooks/use_infinite_fetch.ts`

```tsx
void fetcher(apiPath).then(
  (allData) => {
    setResult((cur) => ({
      ...cur,
      data: [...cur.data, ...allData.slice(offset, offset + LIMIT)],
      isLoading: false,
    }));
    // ...
  },
);
```

**問題点:**
- `fetchMore` が呼ばれるたびに**全データを再取得**し、クライアント側で `slice` している
- サーバー API は `limit`/`offset` パラメータに対応しているのに使っていない
- データ量が多いほど遷移後の初期ロードが遅くなる

**影響度: 中〜高** — 投稿数・コメント数が増えるほど影響が拡大。

### 修正方針
- InfiniteScroll を `IntersectionObserver` ベースに置き換える
- `useInfiniteFetch` でサーバーの `limit`/`offset` を使ったページネーションに変更する

---

## 問題 6: 静的アセットのキャッシュ無効化

**ファイル:** `application/server/src/routes/static.ts`

```tsx
staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
```

### 問題点
- `etag: false`, `lastModified: false` により、**ブラウザキャッシュが一切機能しない**
- フルリロード（問題1）のたびに JS/CSS/画像を毎回ダウンロードし直す
- 304 Not Modified による条件付きリクエストも使えない

### 影響度: **中**

フルリロードを修正すれば影響は減るが、初回訪問後の再訪問や、キャッシュ可能なアセットの再利用が一切できない状態。

### 修正方針
- ビルド生成物にはハッシュ付きファイル名 + 長期 `Cache-Control` を設定
- アップロードファイルや public には `etag: true` を有効化

---

## 問題 7: DM 一覧 API が全メッセージ履歴を返す

**ファイル:** `application/server/src/routes/api/direct_message.ts`

```tsx
directMessageRouter.get("/dm", async (req, res) => {
  const conversations = await DirectMessageConversation.findAll({ ... });
  const sorted = conversations.map((c) => ({
    ...c.toJSON(),
    messages: c.messages?.reverse(),
  }));
  return res.status(200).type("application/json").send(sorted);
});
```

### 問題点
- DM 一覧画面に必要なのは「最新メッセージ1件」だけだが、各会話の**全メッセージ履歴**を返している
- メッセージ数が多い会話があるとレスポンスサイズが膨大になる
- default scope で関連テーブルを全結合している可能性がある

### 影響度: **中**

DM ページへの遷移時に不要なデータ転送と DB 負荷が発生。

### 修正方針
- DM 一覧では最新メッセージ1件のみ含めるようクエリを最適化する
- 個別会話ページでも limit/offset によるページネーションを追加する

---

## 待ち時間のウォーターフォール図

```
ユーザーがリンクをクリック
  │
  ├─ [問題1] フルリロード開始 → HTML ダウンロード
  │    │
  │    ├─ JS/CSS/画像 ダウンロード（キャッシュなし [問題6]）
  │    │    │
  │    │    └─ [問題2] window.load 待ち（全リソース完了まで）
  │    │         │
  │    │         └─ React マウント開始
  │    │              │
  │    │              └─ [問題4] /api/v1/me 同期取得 [問題3]
  │    │                   │  （UIフリーズ）
  │    │                   │
  │    │                   └─ ページコンテンツ描画開始
  │    │                        │
  │    │                        └─ 各ページの API 同期取得 [問題3]
  │    │                             │  （UIフリーズ）
  │    │                             │
  │    │                             └─ データ表示完了
  │    │                                  │
  │    │                                  └─ [問題5] スクロールで26万回ループ
  │
  └─ 理想: クライアント遷移 → 差分レンダリング → 非同期 API → 即座に表示
```

---

## 優先度順の改善リスト

| 優先度 | 問題 | 影響 | 修正難易度 |
|--------|------|------|-----------|
| 1 | Link をクライアント遷移に変更 | 致命的 | 低 |
| 2 | `async: false` を廃止し fetch API に置換 | 致命的 | 中 |
| 3 | `window.load` 待ちを削除 | 高 | 低 |
| 4 | `/api/v1/me` の全画面ブロックを解消 | 高 | 中 |
| 5 | InfiniteScroll を IntersectionObserver に置換 | 高 | 中 |
| 6 | useInfiniteFetch でサーバーの limit/offset を使用 | 中〜高 | 中 |
| 7 | 静的アセットのキャッシュ有効化 | 中 | 低 |
| 8 | DM 一覧 API のレスポンス最適化 | 中 | 中 |
