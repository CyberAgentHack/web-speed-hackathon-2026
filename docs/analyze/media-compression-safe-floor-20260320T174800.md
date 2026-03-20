# Media Compression Safe Floor Report

## 1. 対象

- 画像を安全下限まで圧縮する
- `thumb` を最優先で詰める
- 動画を `VP9 CRF 37` に統一する
- VRT と代表動画の目視確認で安全性を確認する

対象コミット:

- `ac681dc` `Tighten media compression to safe floor`

## 2. 採用した設定

今回採用した圧縮設定は次のとおり。

- `full.webp`: `quality 80`
- `thumb.webp`: `quality 64`
- `full.avif`: `quality 48`
- `thumb.avif`: `quality 50`
- `movie.webm`: `VP9 CRF 37`

安全上の判断:

- 一覧に最も効くのは `thumb.webp` / `thumb.avif`
- 詳細画像は原寸寄りで見られるため `full.webp` / `full.avif` は下げすぎない
- 動画は `CRF 37` までに抑え、`38+` へは進めない
- ユーザー詳細の色抽出に効く `public/images/profiles/*.webp` は圧縮対象から除外

## 3. 実装内容

### 3-1. WebP / WebM の再圧縮

- 変更:
  - `application/scripts/recompress-public-media.mjs`
- 方針:
  - 既存の `public/images/**/*.webp` を再圧縮
  - 既存の `public/movies/**/*.webm` を `CRF 37` で再エンコード
  - サイズが十分減ったものだけ適用
  - `profiles/` は除外

### 3-2. AVIF の拡張

- 変更:
  - `application/scripts/generate-avif-variants.mjs`
  - `application/client/src/utils/avif_image_ids.ts`
  - `application/client/src/utils/get_path.ts`
- 方針:
  - `full` だけでなく `thumb` にも `.avif` を生成
  - 一覧表示では `thumb.avif` を優先利用できるようにする
  - `full` と `thumb` の対象 ID を別 Set で管理

## 4. サイズ削減結果

### 4-1. WebP / WebM 再圧縮

出典:

- `application/reports/public-media-recompression-report.json`

結果:

- 対象チェック数: `105`
- 実際に置換した数: `89`
- `beforeBytes`: `100,913,695`
- `afterBytes`: `80,806,663`
- `savedBytes`: `20,107,032`

削減の大きかった例:

- `public/images/85946f86-c0bd-4d6b-83b7-94eb32dcbcf4.webp`
  - `5,957,930 -> 4,509,256`
  - `-1,448,674`
- `public/images/078c4d42-12e3-4c1d-823c-9ba552f6b066.webp`
  - `5,064,232 -> 3,687,712`
  - `-1,376,520`
- `public/movies/090e7491-5cdb-4a1b-88b1-1e036a45e296.webm`
  - `5,180,651 -> 4,669,411`
  - `-511,240`

### 4-2. AVIF 生成

出典:

- `application/reports/avif-variant-report.json`

結果:

- 生成数: `26`
- `beforeBytes`: `29,315,308`
- `afterBytes`: `13,137,975`
- `savedBytes`: `16,177,333`

内訳:

- `full`
  - `generatedCount`: `8`
  - `savedBytes`: `16,026,178`
- `thumb`
  - `generatedCount`: `18`
  - `savedBytes`: `151,155`

補足:

- `thumb.avif` の 1 件あたり削減は小さいが、ホームの実表示経路に直接効く
- `full.avif` は詳細表示のバックアップとして大きく効く

## 5. 検証結果

### 5-1. VRT

実行:

- `pnpm --dir application --filter @web-speed-hackathon-2026/e2e run test`

結果:

- フル実行では `47 passed / 2 failed / 3 flaky`
- 失敗のうち、圧縮に明確に関係したのは `user-profile` の色抽出のみ

対応:

- `public/images/profiles/*.webp` を圧縮対象から除外
- その後、`src/user-profile.test.ts` を単体再実行して成功
- DM の失敗 1 件も単体再実行で成功

判断:

- 今回の圧縮変更で確認できた明確な回帰は、プロフィール画像の色抽出のみ
- それは除外対応で解消済み
- DM 系の不安定さは圧縮変更そのものより、ローカル実行時の flakiness 寄り

### 5-2. 動画の目視確認

確認した代表動画:

- `application/public/movies/090e7491-5cdb-4a1b-88b1-1e036a45e296.webm`
- `application/public/movies/51a14d70-9dd6-45ad-9f87-64af91ec2779.webm`
- `application/public/movies/fafa6ec6-1572-4def-aa16-4a9fbf28aa41.webm`

確認用フレーム:

- `application/reports/video-review/090e7491-5cdb-4a1b-88b1-1e036a45e296.png`
- `application/reports/video-review/51a14d70-9dd6-45ad-9f87-64af91ec2779.png`
- `application/reports/video-review/fafa6ec6-1572-4def-aa16-4a9fbf28aa41.png`

所見:

- 顕著なブロックノイズや破綻は見られない
- 草や輪郭など高周波の多い領域でも、`CRF 37` はまだ安全側
- これ以上詰めるなら `38-39` は caution、`40+` は非推奨

## 6. リスクと判断

今回の最終判断:

- 画像:
  - 採用
- 一覧サムネイル:
  - 採用
- 動画 `CRF 37`:
  - 採用
- プロフィール画像の再圧縮:
  - 不採用

理由:

- 一覧系と詳細画像は、今回の下限設定で十分な削減と表示維持を両立できた
- 動画も `CRF 37` では視覚破綻が見えなかった
- 一方でプロフィール画像は、色抽出ロジックに影響して VRT を壊したため除外が妥当

## 7. 次にやるなら

1. scoring-tool を全件回して、ページ別の差分を数値で取る
2. `thumb.avif` が効いているホームについて Lighthouse を再計測する
3. 動画は `CRF 38` を別ブランチでだけ試し、代表動画で比較する
4. 色抽出用プロフィール画像は圧縮ではなく、抽出処理自体の高速化で攻める
