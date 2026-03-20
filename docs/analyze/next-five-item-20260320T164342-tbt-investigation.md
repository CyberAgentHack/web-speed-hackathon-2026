# Next Five Item Investigation: TBT (main-thread work) 悪化要因

## 1. 対象項目

- 対象: 「TBT が本当に悪い」問題の原因調査
- 今回は実装せず、根因特定と安全な実装優先順位の確定を行う

## 2. 読んだ docs

- `README.md`
- `docs/regulation.md` (参照: `.agents/skills/wsh-2026-regulation-preflight/references/2026-regulation-core.md`)
- `docs/scoring.md` と `scoring-tool/README.md` (参照: `.agents/skills/wsh-2026-regulation-preflight/references/2026-scoring-impact.md`)
- `docs/test_cases.md` (参照: `.agents/skills/wsh-2026-regulation-preflight/references/2026-manual-test-map.md`)
- `docs/analyze/next-five-item-20260320T161620-all-five.md`

## 3. 対象項目の再定義

- 何を変えるか: ホーム初回表示時の main thread 占有時間を下げる
- 何を削る/遅延化するか: 初回表示に不要な重い JS 実行（特に音声波形計算）を interaction 後に後ろ倒し
- 期待改善指標: Home の `mainthread-work-breakdown`, `bootup-time`, `TBT`
- 主戦場:
  - `application/client/src/components/foundation/SoundPlayer.tsx`
  - `application/client/src/components/foundation/SoundWaveSVG.tsx`
  - `application/client/src/components/foundation/InfiniteScroll.tsx`
  - `application/client/src/components/timeline/TimelineItem.tsx`

## 4. Artifact 調査結果（実測）

Lighthouse JSON と webpack stats から抽出:

- Home mobile:
  - `mainthread-work-breakdown`: `16.2s`
  - `bootup-time`: `11.9s`
  - `long-tasks`: `6`
  - `scriptEvaluation`: `11.9s`
  - `garbageCollection`: `3.5s`
- Home desktop:
  - `mainthread-work-breakdown`: `5.0s`
  - `bootup-time`: `3.6s`
  - `long-tasks`: `5`
  - `scriptEvaluation`: `3.6s`
  - `garbageCollection`: `1.1s`

`bootup-time` の URL 別内訳では、いずれも `http://localhost:3000/scripts/main.js` が CPU 時間のほぼ全体を占有。

補足:

- `/api/v1/posts?limit=30&offset=0` は Lighthouse 上では 1 リクエストのみ（大量追い読み込みは観測されず）
- `unused-javascript` は `31KiB` 程度で、未使用コード削減だけでは今回の規模感に届かない

## 5. 影響範囲のコード調査

### A. 音声波形の同期計算コストが高い

`SoundWaveSVG` で、各音声ごとに以下を即時実行:

- `AudioContext` 生成
- `decodeAudioData()`
- 左右チャネル全サンプルへの `lodash` ベース map/chunk/mean

該当コード:

- `application/client/src/components/foundation/SoundWaveSVG.tsx`
- `application/client/src/components/foundation/SoundPlayer.tsx`

`SoundPlayer` は mount 直後に `fetch(soundUrl).arrayBuffer()` を実行し、可視状態やユーザー操作を待たない。
このため、ホーム初回 30 件内に音声投稿が複数あると、初期描画フェーズで decode + 大量配列処理が同時発火する。

### B. GC 比率が高い理由と整合

`mainthread-work-breakdown` の上位が `Script Evaluation` と `Garbage Collection`。
`SoundWaveSVG` の全サンプル配列変換（`leftData/rightData/normalized/chunks/peaks`）は中間配列が多く、GC 増加と整合する。

### C. `main.js` が重いように見える理由

webpack stats の `main.js` ファイルサイズ自体は `~270KB` だが、
Lighthouse の attribution は「起点スクリプト」に寄るため、初期描画で起動する React ツリー配下の同期処理が `main.js` に計上される。
したがって、根因は「バンドル容量」単独ではなく「初期マウントで走る処理内容」。

## 6. リスク分類

- 判定: `safe`（調査として）
- 理由:
  - 仕様削減や表示省略を行わず、CPU ホットスポット特定に留めた
  - regulation 上の禁止領域（機能削減・デザイン劣化・SSE 変更）には未接触

## 7. 実装方針候補（比較）

### 最小変更案（推奨）

- 音声波形生成を「再生操作後」または「カードが十分可視になった後」に遅延
- `SoundPlayer` の `soundData fetch` を mount 即時から条件付きに変更
- `SoundWaveSVG` の計算を Web Worker に逃がす前段として、まずは発火条件を絞る

期待: TBT 改善大 / 見た目維持 / レギュレーション安全性が高い

### 効果優先案

- 音声波形計算を Worker 化し、メインスレッド実行を最小化
- 必要ならピーク事前計算（サーバー側）を検討

期待: 改善幅は大きいが、実装範囲と検証範囲が広くなる

### 安全優先案

- まずは `SoundWaveSVG` の lodash 依存計算を軽量ループへ置換（中間配列削減）
- 次に遅延条件を追加

期待: 差分が小さく戻しやすいが、単独では改善幅が不足する可能性

## 8. 今回の結論

- TBT 悪化の主因は「初期描画時に音声波形計算が同期で走ること」
- 次点で、初期ルート配下のメディア関連処理が同時に立ち上がる設計
- `unused-js` 改善だけではこのボトルネックは取り切れない

## 9. 未確認事項

- 変更後の Lighthouse 再計測（今回は未実装のため未実施）
- VRT / 手動テスト（今回は未実装のため未実施）
- scoring-tool 全ターゲット比較（今回は未実施）

## 10. 次アクション（この順で推奨）

1. `SoundPlayer` の波形処理を interaction 後に遅延
2. `SoundWaveSVG` の計算ロジックを中間配列削減版へ置換
3. Home mobile/desktop を再計測し、`TBT/mainthread/bootup` の差分を確認
4. VRT と `docs/test_cases.md` 対応の手動確認を実施
