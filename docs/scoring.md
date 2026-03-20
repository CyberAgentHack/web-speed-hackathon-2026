## 採点方法

URL・操作手順・待機条件など、**計測シナリオの詳細**は [採点シナリオ詳細](./scoring-scenarios.md) を参照してください。

1. [Lighthouse](https://github.com/GoogleChrome/lighthouse) を用いて、次の2つを検査します
   - ページの表示（900点満点）
   - ページの操作（250点満点）
2. 検査したそれぞれのスコアを合算し、得点とします（1150点満点）

ただし，採点にあたっては以下のルールで実施します

- 採点を高速化するため、 **「ページの表示」で300点以上獲得した場合にのみ「ページの操作」の採点を行います**
  - 採点対象外となった項目は0点として計算されます
- 採点結果は随時リーダーボードに表示されますが、 **競技終了後のレギュレーションチェックにて違反が発見された場合、最終順位からは除外され、対象外となります**

### ページの表示

1. [Lighthouse](https://github.com/GoogleChrome/lighthouse) を用いて、次の9つのページを検査します
   - ホーム
   - 投稿詳細
   - 写真つき投稿詳細
   - 動画つき投稿詳細
   - 音声つき投稿詳細
   - DM一覧
   - DM詳細
   - 検索
   - 利用規約
2. [Lighthouse v10 Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#lighthouse_10) に基づき、次の総和をページのスコアとします
   - First Contentful Paint のスコア × 10 (0-10 点)
   - Speed Index のスコア × 10 (0-10 点)
   - Largest Contentful Paint のスコア × 25 (0-25 点)
   - Total Blocking Time のスコア × 30 (0-30 点)
   - Cumulative Layout Shift のスコア × 25 (0-25 点)
3. 各ページのスコアを合算し、「ページの表示」の得点とします (900点満点)

### ページの操作

1. [Lighthouse](https://github.com/GoogleChrome/lighthouse) を用いて、次の5つのシナリオを検査します
   - ユーザーの認証
     - ユーザー登録 → サインアウト → サインイン
   - DM
     - DM 送信
   - 検索
     - 検索 → 結果表示
   - Crok
     - AI チャット実行
   - 投稿
     - テキストのみの投稿 → メディアつきの投稿
2. 次の総和をシナリオのスコアとします
   - Total Blocking Time のスコア × 25 (0-25 点)
   - Interaction to Next Paint のスコア × 25 (0-25 点)
3. 各シナリオのスコアを合算し、「ページの操作」の得点とします（250点満点）
