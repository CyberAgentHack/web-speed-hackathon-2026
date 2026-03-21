# 17. フォント最適化 (2026-03-21)

## 変更内容

OTF フォント 2 ファイル (13MB) を WOFF2 サブセットに変換し、font-display を block → swap に変更。

### 変換手順

1. アプリで使用される文字を収集:
   - `server/seeds/*.jsonl` (シードデータ: 投稿本文、ユーザー名、利用規約等)
   - `client/src/**/*.{tsx,ts,css,html}` (UIテキスト)
   - `server/src/**/*.ts` (サーバー側テキスト)
   - ASCII (0x20-0x7E)
2. ユニーク文字を抽出 → 1254文字
3. `subset-font` (npm) で OTF → WOFF2 サブセット変換
   - 入力: OTF (フルグリフセット)
   - 出力: WOFF2 (使用文字のみ、Brotli圧縮)

```js
const subsetFont = require("subset-font");
const subset = await subsetFont(fontData, uniqueChars, { targetFormat: "woff2" });
```

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/index.css` | OTF → WOFF2 パス変更、font-display: block → swap |
| `public/fonts/*.woff2` | サブセット済み WOFF2 ファイル (2ファイル) |
| `public/fonts/*.otf` | 削除 |

## 効果

| ファイル | Before | After | 削減率 |
|---|---|---|---|
| ReiNoAreMincho-Regular | 6.4MB (OTF) | 342KB (WOFF2) | 95% |
| ReiNoAreMincho-Heavy | 6.5MB (OTF) | 325KB (WOFF2) | 95% |
| 合計 | 13MB | 667KB | 95% |

- `font-display: swap` により FCP ブロック解消
- 過去 (log 08) に断念した施策だが、upstream の e2e 更新 (`waitForPageToLoad`) により VRT が安定

## VRT 結果

- VRTスクリーンショット含むテスト: 全て合格
  - `ホーム › タイムラインが表示される`
  - `レスポンシブ › スマホ/デスクトップ表示`
  - `利用規約 › ページが正しく表示されている`
  - `ユーザー詳細`
  - `投稿詳細 - 動画/音声/写真`
- 40 passed, 9 failed (既存問題), 3 flaky
