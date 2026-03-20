---
status: complete
priority: p0
issue_id: "021"
tags: [e2e, ssr, hydration, react, suspense, lazy, critical]
dependencies: []
---

# SSR hydration 時にメインコンテンツが消失する（全ページ影響）

## Problem Statement

SSR で正しくレンダリングされたコンテンツが、クライアント hydration 時に `React.lazy()` + `<Suspense fallback={null}>` の組み合わせにより一瞬完全に消失する。全ページの `<main>` が空になり、E2E テスト 32件中 27件が失敗する根本原因。

これはテストの問題ではなく **本番 UX のバグ** でもある（SSR → 白フラッシュ → CSR 再レンダリング）。

## Findings

### 証拠: error-context.md の共通パターン

全失敗テストの DOM スナップショットが同一構造:

```yaml
- complementary:     # サイドバー ✓ 表示される
    - navigation: ...
- main [ref=e33]     # ← 空。子要素なし
```

サイドバーは SSR の HTML が残るが、`<main>` 内のルートコンテナは `React.lazy()` で読み込まれるため、hydration 時に Suspense boundary がトリガーされ `fallback={null}` に置き換わる。

### メカニズム

1. **SSR (entry-server.tsx):** ルートコンテナを同期的に import → 正しい HTML を生成
2. **Client hydration (entry-client.tsx):** ルートコンテナを `React.lazy()` で import
3. **hydration 開始:** React が SSR の HTML を引き継ごうとする
4. **lazy() が Suspense をトリガー:** chunk 未ロードのため `<Suspense fallback={null}>` が発火
5. **SSR の HTML が消失:** `<main>` 内が空になる
6. **chunk ロード完了後:** コンテンツが再レンダリングされる

ステップ 4-5 の間にテストが DOM を検査すると、メインコンテンツが存在しない。

### 影響範囲

| テストカテゴリ | 失敗数 | 原因との関係 |
|-------------|--------|------------|
| home (タイムライン/動画/音声/写真/遷移) | 5 | `<main>` 空 → article/video/audio/img 不在 |
| post-detail (VRT/タイトル/動画/音声/写真) | 5 | `<main>` 空 → コンテンツ不在 |
| DM (ソート/モーダル/送信/メッセージ/入力/既読) | 6 | login() 失敗（disabled ボタン = hydration 未完了でフォームバリデーション不動作） |
| posting (テキスト/画像) | 2 | login() 失敗（同上） |
| crok-chat (サジェスト/AI応答) | 2 | login() 失敗 + VRT 不一致 |
| responsive (スマホ/デスクトップ) | 2 | VRT baseline 差異（hydration 中間状態） |
| user-profile | 1 | VRT 不一致 |
| search | 1 | 検索結果タイムアウト |
| terms | 1 | VRT 不一致 |
| **合計** | **~27** | |

### login() disabled 問題の関係

todo 018 で独立した問題と分析していた「サインインボタンが disabled のまま」は、本問題の派生である可能性が高い:
- hydration 未完了 → フォームの onChange/バリデーションロジックが attach されていない
- `pressSequentially()` で入力してもバリデーションが走らず、ボタンが enabled にならない

## Proposed Solutions

### A. entry-client.tsx で SSR 対象ルートを eager import（推奨）

SSR でレンダリングするコンテナと同じモジュールを、entry-client.tsx でも同期的に import する。

```tsx
// entry-client.tsx
// SSR 対象ルートは eager import で hydration の Suspense フォールバックを防ぐ
import { TimelineContainer } from "./containers/TimelineContainer";
import { PostContainer } from "./containers/PostContainer";
import { UserProfileContainer } from "./containers/UserProfileContainer";
// ... 他の SSR 対象ルート

// AppContainer 内の lazy() を条件分岐で eager 版に差し替え
```

- Effort: 中（entry-client.tsx + AppContainer のルーティング変更）
- Risk: 低（初期バンドルサイズ増加だが、SSR 対象ルートは初回アクセスで必ず必要）
- Pros: 根本解決。SSR HTML が保持され FCP/LCP も改善

### B. Suspense fallback をスケルトン UI に変更（緩和策）

```tsx
<Suspense fallback={<MainSkeleton />}>
```

- Effort: 小
- Risk: 低
- Pros: 白フラッシュは防げる
- Cons: テストは依然として実コンテンツを待つ必要があり、タイムアウト問題は残る

### C. hydrateRoot の前に lazy chunk を preload

```tsx
// entry-client.tsx
const route = window.location.pathname;
const preloads = matchRoute(route); // 現在のルートに必要な chunk を特定
await Promise.all(preloads.map(p => p.load())); // chunk ロード完了を待つ
hydrateRoot(document.getElementById("root")!, <App />);
```

- Effort: 中
- Risk: 低
- Pros: hydration 前に chunk が確実にロードされる
- Cons: hydration 開始が遅れる（TTI への影響）

### D. React Router の lazy route を活用

React Router v7 の `lazy` プロパティでルートレベルの遅延ロードに切り替え。`React.lazy()` + `Suspense` ではなく、Router が chunk ロードを管理。

- Effort: 大（ルーティング構造の変更）
- Risk: 中
- Pros: フレームワーク標準のパターン

## Recommended Action

**A (eager import) + C (preload) のハイブリッド。**

1. まず A で SSR 対象ルートを eager import し、hydration の白フラッシュを即座に解消
2. SSR 対象外のルート（/crok, /dm など認証必須ページ）は C で preload
3. これにより全 E2E テストの根本原因が解消され、todo 018 の login() 問題も同時に解決される見込み

## Acceptance Criteria

- [ ] SSR でレンダリングされたページの hydration 時に `<main>` が空にならない
- [ ] `home.test.ts` の全テストが pass する
- [ ] `post-detail.test.ts` の全テストが pass する
- [ ] `login()` を使うテスト (dm, posting, crok-chat) で disabled ボタン問題が解消する
- [ ] `responsive.test.ts` の VRT テストが pass する
- [ ] `search.test.ts` の全テストが pass する
- [ ] `terms.test.ts` の VRT テストが pass する
- [ ] `user-profile.test.ts` の全テストが pass する（oklch 問題は todo 019 で別途対応）
- [ ] ブラウザで SSR ページアクセス時に白フラッシュが発生しない

## Technical Details

### 調査が必要なファイル

- `application/client/src/entry-client.tsx` — hydration エントリポイント
- `application/client/src/entry-server.tsx` — SSR エントリポイント
- `application/client/src/containers/AppContainer.tsx` — ルーティング + lazy() 定義
- `application/client/vite.config.ts` — SSR 設定

### 関連 TODO

- ~~todo 018~~ (login disabled) — 本問題の派生症状。本修正で同時解消の見込み
- todo 019 (oklch) — 独立した問題。本修正後も別途対応必要
- ~~todo 020~~ (VRT + hydration) — 本 TODO に統合

## Work Log

### 2026-03-20 - 根本原因の特定

**By:** Claude Code

**Actions:**
- 初期コミット (e6607b7) の worktree で VRT baseline を全て再生成
- 新 baseline で現在のコード (main) に対してフルテスト実行 → 27件失敗
- 全失敗テストの error-context.md を横断分析
- 共通パターン発見: `<main>` が空（サイドバーのみ表示）
- SSR → hydration → lazy() → Suspense fallback(null) → コンテンツ消失のメカニズムを特定
- login() disabled 問題 (旧 todo 018) が本問題の派生症状であることを確認

**Learnings:**
- SSR と `React.lazy()` の組み合わせは hydration 時に必ず Suspense をトリガーする
- `fallback={null}` は SSR コンテンツを完全に消す — SSR の意味がなくなる
- SSR 対象ルートは entry-client でも同期 import が必須
- テスト失敗の大半が単一の根本原因に帰結することがある — 個別修正より根本対応が効率的
