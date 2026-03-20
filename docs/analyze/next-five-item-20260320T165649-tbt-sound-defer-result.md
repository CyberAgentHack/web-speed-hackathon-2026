# 実装結果レポート: 音声波形遅延 + 計算最適化

## 1. 対象項目

- 音声波形生成を可視時まで遅延（IntersectionObserver）
- SoundWaveSVG の lodash 計算を単一パスループに置換
- AudioContext の close 追加

## 2. 変更ファイル

- `application/client/src/components/foundation/SoundPlayer.tsx`
- `application/client/src/components/foundation/SoundWaveSVG.tsx`

## 3. Lighthouse 前後比較

### Home / mobile（主計測対象）

| 指標 | 変更前 (16:15) | 変更後 (16:55) | 差分 |
|---|---|---|---|
| score | 0.45 | 0.37 | **-0.08 悪化** |
| FCP | 764ms | 764ms | ±0 |
| SI | 1,500ms | 860ms | -640ms 改善 |
| LCP | 29,900ms | 9,269ms | -20,631ms 改善 |
| TBT | 18,930ms | 542ms | **-18,388ms 大幅改善** |
| CLS | 不明 | 0.872 | **大幅悪化** |
| mainthread | 16,245ms | 1,419ms | **-14,826ms 大幅改善** |
| bootup | 11,905ms | 845ms | **-11,060ms 大幅改善** |
| long tasks | 6 | 2 | -4 改善 |

### Home / desktop（前回計測 16:15 のまま未再計測）

| 指標 | 値 |
|---|---|
| score | 0.57 |
| LCP | 2,451ms |
| TBT | 4,303ms |
| CLS | 0 |

## 4. 分析

### TBT / mainthread / bootup は劇的改善

- mobile TBT: 18,930ms → 542ms（**97% 削減**）
- mainthread: 16,245ms → 1,419ms（**91% 削減**）
- bootup: 11,905ms → 845ms（**93% 削減**）

音声波形の mount 即時 fetch + lodash 計算が初回描画のボトルネックだったことが実測で裏付けられた。

### CLS が大幅悪化（0.872）

CLS の悪化原因は今回の変更とは直接的に関係しない可能性がある。

考えられる原因:

1. 音声波形の遅延表示により、波形エリアのサイズが描画後に変わる（ただし既存実装でも `soundData == null` のときは波形が空なので、レイアウトシフトは発生しない設計）
2. Lighthouse の計測タイミング差による CLS 検出の揺れ
3. 別の要因（画像のサイズ未指定、フォント swap など）

調査が必要な点:

- 変更前の CLS 値が JSON にあったか（前回計測 JSON の CLS を確認）
- `SoundPlayer` のコンテナサイズが可視前後で変わるか（変わらないはず）
- 画像やフォントの CLS 寄与がないか

### LCP は改善（29.9s → 9.3s）

TBT 改善によりメインスレッドが解放され、LCP 計測タイミングも改善した可能性がある。
ただしまだ 9.3s と高い。

### score が下がった理由

CLS の重み（x25）が大きく、0.872 という値が score を押し下げている。
TBT（x30）の改善幅は大きいが、CLS 悪化がそれを上回った。

## 5. E2E テスト結果

- 50 passed, 2 flaky（DM 系 retry 成功 — 変更前と同パターン）
- 音声波形表示、再生操作、投稿詳細の音声テストすべて通過

## 6. Bundle サイズ

- `main.js`: 263.9 KiB（変更前 364.7 KiB、**-100.8 KiB**）
- lodash が SoundWaveSVG のチャンクから除去されたことによる

## 7. リスクと未確認事項

- CLS 悪化の根因が未特定
- desktop 側の再計測が未実施
- scoring-tool 全ターゲット比較が未実施
- 人手の目視確認が未実施

## 8. 判断

- TBT / mainthread / bootup は大幅改善で方向性は正しい
- CLS 悪化は別途調査が必要（今回の変更が原因かどうか切り分けが必要）
- 一旦コミット済みの状態で記録を残し、次のアクションで CLS を調査する

## 9. 次アクション

1. CLS 悪化の根因調査（Lighthouse の CLS 内訳を確認）
2. desktop 側を再計測して同傾向か確認
3. CLS が今回の変更起因なら修正、別要因なら別途対応
