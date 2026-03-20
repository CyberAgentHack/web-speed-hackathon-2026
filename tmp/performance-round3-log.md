# Performance Round 3 - 追加最適化ログ

## 実施日: 2026-03-21

## 概要
DM最適化・フォント圧縮・LCPプリロード等の前回作業に続き、さらなるパフォーマンス改善を実施。

---

## 1. 画像品質の統一 (image_optimizer.ts)
- **変更前**: プロフィール画像 quality 80、投稿画像 quality 40
- **変更後**: 両方 quality 60 に統一
- **理由**: quality 40は低すぎてレギュレーション違反リスク、80は不要に高い

## 2. PausableMovie - IntersectionObserver + preload="none"
- **ファイル**: `client/src/components/foundation/PausableMovie.tsx`
- **問題**: 全動画が即座にautoPlay + rAFループで毎フレームcanvas描画 → ビューポート外でもメインスレッド占有
- **修正**:
  - IntersectionObserverでビューポート外の動画を`video.pause()` + rAFループ停止
  - ビューポートに入ったら再開（ユーザーが手動pauseした場合は再開しない）
  - `preload="none"` 追加でビューポート外の動画ダウンロードも遅延
  - `<>...</>` → `<div ref={containerRef}>...</div>` でObserver対象要素を追加

## 3. 検索結果0件の修正 (search.tsx)
- **問題**: クライアントナビゲーションで検索すると0件表示。リロードでは正常。
- **原因**: `useInfiniteFetch`のuseStateは初回レンダーの値を保持。同じコンポーネントインスタンスでloaderデータが更新されてもhookの状態は更新されない。
- **修正**: `SearchContent`コンポーネントを分離し、`key={query}`で検索クエリ変更時にコンポーネントを再マウントさせて状態をリセット

## 4. 検索API修正 (api/search.ts)
- **問題**: `Post.unscoped()` + `User.unscoped()` の `attributes: []` でユーザーカラムが0個 → `$user.username$` フィルタが動作しない可能性
- **修正**: `attributes: ["id", "username", "name"]` に変更してフィルタに必要なカラムを明示

## 5. Font Awesome SVGサブセット化
- **ファイル**: `public/sprites/font-awesome/solid.svg`, `regular.svg`
- **変更前**: solid.svg 654KB (1002アイコン), regular.svg 110KB (152アイコン)
- **変更後**: solid.svg 7.4KB (17アイコン), regular.svg 1.1KB (1アイコン)
- **削減率**: 99%
- **使用アイコン (solid)**: home, search, envelope, edit, user, sign-in-alt, balance-scale, paper-plane, exclamation-circle, arrow-right, arrow-down, circle-notch, images, music, video, pause, play
- **使用アイコン (regular)**: calendar-alt

## 6. 動画MP4再圧縮
- **対象**: `public/movies/*.mp4` 全15ファイル
- **変更前**: CRF 28, 元解像度, preset fast → 合計約23MB
- **変更後**: CRF 32, 最大320px幅, preset medium → 合計約1MB
- **削減率**: 96%
- **コマンド**: `ffmpeg -y -i input.mp4 -movflags +faststart -pix_fmt yuv420p -vf "scale='min(320,iw)':'-2'" -c:v libx264 -preset medium -crf 32 -an output.mp4`

## 7. CSS インライン化 (app.ts) ※検証中
- **問題**: `root-*.css` (7.2KB gzip) がレンダーブロッキング、170msの追加レイテンシ
- **修正**: Express middlewareでSSR HTMLレスポンスの`<link rel="stylesheet">`を`<style>`タグに置換
- **仕組み**: サーバー起動時にCSSファイルを読み込み、HTMLストリームをバッファリングしてlink→style変換

---

## スコア (インライン化前)

### 通常テスト
| テスト項目 | CLS (25) | FCP (10) | LCP (25) | SI (10) | TBT (30) | 合計 (100) |
|---|---|---|---|---|---|---|
| ホーム | 25.00 | 2.80 | 12.25 | 6.10 | 30.00 | **76.15** |
| 投稿詳細 | 25.00 | 2.70 | 12.75 | 6.00 | 30.00 | **76.45** |
| 写真つき投稿詳細 | 25.00 | 2.60 | 11.00 | 5.90 | 30.00 | **74.50** |
| 動画つき投稿詳細 | 25.00 | 2.50 | 13.00 | 5.70 | 30.00 | **76.20** |
| 音声つき投稿詳細 | 25.00 | 2.70 | 15.25 | 6.00 | 30.00 | **78.95** |
| 検索ページ | 25.00 | 2.60 | 15.00 | 5.90 | 30.00 | **78.50** |
| DM一覧 | 25.00 | 7.00 | 21.50 | 9.00 | 30.00 | **92.50** |
| DM詳細 | 25.00 | 5.50 | 19.50 | 8.30 | 30.00 | **88.30** |
| 利用規約 | 25.00 | 1.30 | 11.25 | 4.00 | 30.00 | **71.55** |

### ユーザーフローテスト
| テスト項目 | INP (25) | TBT (25) | 合計 (50) |
|---|---|---|---|
| ユーザー登録→サインアウト→サインイン | 3.00 | 0.00 | **3.00** |
| DM送信 | 25.00 | 21.75 | **46.75** |
| 検索→結果表示 | - | - | 計測不可 |
| Crok AIチャット | 24.50 | 0.00 | **24.50** |
| 投稿 | - | - | 計測不可 |

### 合計: 787.35 / 1150.00

---

## 未解決・注意点
- **検索→結果表示**: 「検索結果の表示に失敗しました」→ クライアントナビゲーション修正済みだが要再検証
- **投稿フロー**: 「画像投稿の完了を確認できませんでした」→ 未調査
- **ユーザー登録フロー**: INP 3.00, TBT 0.00 → モーダル操作のINPが低い
- **CSSインライン化**: 実装済み、効果は次回計測で確認
- **FCP/LCP**: 全ページで低め。SSRは機能しているがハイドレーションコストが主要因
