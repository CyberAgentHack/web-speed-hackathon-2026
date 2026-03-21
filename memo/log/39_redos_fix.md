# 39. ReDoS正規表現の修正 (2026-03-21)

## 変更内容

3箇所のReDoS脆弱性を持つ正規表現を安全なものに置換。

### 1. auth/validation.ts:16
- Before: `/^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v` — `[...]*` を `{16,}` で繰り返し、指数的バックトラック
- After: `/^[\p{Letter}\p{Number}]{16,}$/v` — 同じ意味、バックトラックなし

### 2. search/services.ts:13-14
- Before: `/since:((\d|\d\d|\d\d\d\d-\d\d-\d\d)+)+$/` — ネスト量指定子 `(...)+)+`
- After: `/since:(\d{4}-\d{2}-\d{2})$/` — 日付フォーマットのみ厳密マッチ

### 3. search/services.ts:41
- Before: `/^(\d+)+-(\d+)+-(\d+)+$/` — `(\d+)+` で指数的バックトラック
- After: `/^\d{1,4}-\d{1,2}-\d{1,2}$/` — 固定長、バックトラックなし

## 理由

- auth validation: redux-formがキー入力ごとにvalidateを呼ぶため、パスワード入力でTBTに影響
- search services: 検索フローが「計測できません」になっている原因の可能性（`since:111111111111` のような入力でフリーズ）

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/auth/validation.ts` | ReDoS正規表現を修正 |
| `client/src/search/services.ts` | ReDoS正規表現を3箇所修正 |

## 計測

未計測
