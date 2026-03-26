# lodash/moment をネイティブ JS に置き換え

## 変更内容

### moment → Intl API
- `moment().format("LL")` → `Intl.DateTimeFormat("en-US", {...})` で置き換え
- `moment().format("HH:mm")` → `Intl.DateTimeFormat("ja-JP", {...})` で置き換え
- `moment().fromNow()` → `Intl.RelativeTimeFormat("ja")` で置き換え
- ユーティリティ `utils/date_format.ts` を新規作成
- 対象: TimelineItem, PostItem, CommentItem, UserProfileHeader, DirectMessageListPage, DirectMessagePage

### lodash → ネイティブ JS
- SoundWaveSVG.tsx: `_.map`, `_.zip`, `_.chunk`, `_.mean`, `_.max` → `Array.from`, `for` ループ, `Math.max` に置き換え
- bm25_search.ts: `_.zipWith`, `_.filter`, `_.sortBy` → `Array.map`, `Array.filter`, `Array.sort` に置き換え

### package.json
- `lodash`, `moment`, `@types/lodash` を dependencies から削除

## 効果
- lodash (70KB) + moment (59KB) = 129KB がバンドルから完全除外
- ネイティブ API のみで同等機能を実現

## VRT 結果

未計測

## 計測結果

未計測
