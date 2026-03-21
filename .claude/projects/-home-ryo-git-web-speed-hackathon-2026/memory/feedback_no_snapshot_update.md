---
name: VRTスナップショット更新禁止
description: VRTのスナップショット画像は更新してはいけない（レギュレーション違反）
type: feedback
---

VRTのスナップショット画像（.png）は絶対に `--update-snapshots` で更新してはいけない。レギュレーション違反になる。

**Why:** ハッカソンのレギュレーションで、VRTスナップショットの変更は禁止されている。

**How to apply:** VRTでスクリーンショット差分が出た場合は、コードの実装側を修正して既存スナップショットと一致するようにする。`playwright test --update-snapshots` は絶対に使わない。
