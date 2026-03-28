# 07 Crok Suggestion and Tokenizer Cache

## 背景

Crok入力中に毎キー入力でサジェストAPI取得と形態素処理が走り、クライアント/サーバー双方で不要負荷が発生していた。

## 実施内容

- `application/client/src/components/crok/ChatInput.tsx`
  - kuromoji トークナイザーをモジュールスコープで Promise キャッシュ
  - サジェスト一覧を `suggestionsCacheRef` でキャッシュ（初回取得後は再取得しない）
  - サジェスト更新に 180ms のデバウンスを導入
- `application/client/src/utils/negaposi_analyzer.ts`
  - ネガポジ判定で使う kuromoji トークナイザーを Promise キャッシュ
  - 検索時の再構築コストを抑制

## 影響範囲

- Crokサジェスト表示
- 検索画面のネガポジ判定

## リスクと対策

- リスク: サジェストデータ更新が即時反映されない
- 対策: 仕様上サジェストは静的シード想定のため、セッション内キャッシュは許容範囲

## 検証結果

- `pnpm --dir application/client exec tsc --noEmit` 成功
- ローカル採点計測は方針により未実施
