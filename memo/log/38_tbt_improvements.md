# 38. TBT改善: ポーリング・kuromoji・Markdown・FastAverageColor (2026-03-21)

## 変更内容

### 1. scheduler.postTask ポーリング廃止 (CRITICAL)
`use_search_params.ts` と `use_has_content_below.ts` が `scheduler.postTask` で `user-blocking` 優先度 + 1ms delay のポーリングを行っていた。
- `use_search_params.ts` → 削除。react-router の `useSearchParams` をそのまま使用
- `use_has_content_below.ts` → scroll/resize イベント + ResizeObserver に変更

### 2. kuromoji シングルトン化 (CRITICAL)
`ChatInput.tsx` と `negaposi_analyzer.ts` がそれぞれ独立に `kuromoji.builder().build()` を呼んでいた。辞書ビルド（数百ms）が複数回走る問題を、共有シングルトン (`kuromoji_tokenizer.ts`) で解消。

### 3. ChatMessage key={content} 削除 (MEDIUM)
SSEストリーミング中に `key={content}` で毎チャンクMarkdown全体がアンマウント→再マウントされていた。`key` を削除してReactの差分更新に任せる。

### 4. FastAverageColor precision → simple (MEDIUM)
`UserProfileHeader.tsx` で `mode: "precision"` が全ピクセルスキャンしていた。`mode: "simple"` でサンプリングに変更。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/hooks/use_search_params.ts` | 削除（react-router の useSearchParams を使用） |
| `client/src/containers/SearchContainer.tsx` | import先を react-router に変更 |
| `client/src/hooks/use_has_content_below.ts` | ポーリング → scroll/resize + ResizeObserver |
| `client/src/utils/kuromoji_tokenizer.ts` | 新規: 共有シングルトン |
| `client/src/utils/negaposi_analyzer.ts` | 独自ビルド → 共有シングルトン使用 |
| `client/src/components/crok/ChatInput.tsx` | 独自ビルド → 共有シングルトン使用 |
| `client/src/components/crok/ChatMessage.tsx` | `key={content}` 削除 |
| `client/src/components/user_profile/UserProfileHeader.tsx` | FastAverageColor `precision` → `simple` |

## 計測

未計測
