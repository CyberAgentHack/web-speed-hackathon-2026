# WSH 罠・失格パターン集

> [!CAUTION]
>
> 上位勢でも失格する。これを読んで同じ轍を踏まないこと。

---

## 失格の規模感

過去 3 回の競技で**毎回上位 10 名程度が失格**している。上位陣であっても失格は他人事ではない。
失格条件: 「Google Chrome 最新版での著しい機能落ちやデザイン差異」および「悪意あるコード」

---

## 毎年仕込まれる罠一覧

> 詳細は [years.md](./years.md) を参照。

| 罠のパターン | 年度 | 対処法 |
|------------|------|--------|
| webpack/Vite が `development` mode | **全年** | `mode: 'production'` に変更 |
| source map がインライン埋め込み | **全年** | `devtool: false` |
| `NODE_ENV=development` | **全年** | `NODE_ENV=production` |
| 重いライブラリ (moment/lodash/jQuery 等) | **全年** | 削除・軽量代替に置換 |
| ReDoS 脆弱性正規表現 (ログイン・バリデーション) | **全年** | 正規表現を簡略化 |
| DB インデックスなし | **全年** | インデックスを追加 |
| gzip/Brotli 圧縮なし | **全年** | 圧縮を有効化 |
| 画像・フォントが未最適化 | **全年** | WebP/AVIF 変換、サブセット化 |
| `p-min-delay` で意図的 1000ms 遅延 | 2025 | 削除 |
| FFmpeg WASM (30〜40MB) | 2025 | 削除してサーバー側で事前生成 |
| UnoCSS がランタイム動作 | 2025 | 静的ビルドに移行 |
| グローバルマウス位置追跡 (`useSubscribePointer`) | 2025 | 削除 (CSS :hover に置換) |
| SVG ロゴに base64 フォント埋め込み (5MB+) | 2025/2024 | PNG に変換 |
| m3u8 プレイリストに 3MB の randomBytes padding | 2025 | サーバーで除去 |
| `LimitChunkCountPlugin(maxChunks: 1)` | 2025 | 削除してチャンク分割を有効化 |
| 動画プレイヤー 3 種 (Shaka/hls.js/Video.js) を全バンドル | 2025 | 動的 import で分離 → TBT 満点達成の事例あり |
| hls.js の WebWorker が意図的に無効化 | 2025 | 有効化 |
| `no-store` が全 HTTP レスポンスにデフォルト設定 | 2025 | 削除して適切なキャッシュを設定 |
| Three.js で HeroImage を Canvas に描画 | 2024 | `<img>` タグに置換 |
| Service Worker に Jitter/delay + 並列 5 件制限 | 2024 | 削除・制限解除 |
| 漫画ビューア内に 4096 回のループ | 2024 | 削減 |
| `useSuspenseQuery` で FCP 遅延 | 2023 | `useQuery` に変換 |
| 同期 XHR (syncXhr) | 2023 | 非同期並列化 → スコア 2 倍 |
| GraphQL の N+1 | 2023 | DataLoader で解消 |
| `zipcode-ja` (郵便番号 DB 全体をバンドル) | 2023 | 外部 API に置換 |
| `ImmutableJS` を使って即 `toJS()` で変換 | 2020 | 削除 |
| `babel-node` をプロダクションで使用 | 2020 | Node.js 直接実行に変更 |
| `<script>` に `defer` なし (レンダーブロッキング) | 2020 | `defer` を追加 |
| API 呼び出しがシーケンシャル | 2020/共通 | `Promise.all` で並列化 |

---

## 致命的な失格パターン

### 1. UnoCSS の動的クラス名 (2025 年で多数失格)

**症状**: アイコンが消える・UI が壊れる・VRT が通らない

**原因**: UnoCSS をランタイムから静的ビルドに移行した際、動的クラス名が抽出されない

```tsx
// NG: テンプレートリテラルや条件式で生成したクラス名は静的抽出不可
const iconClass = `i-fa-solid:${isChecked ? 'check' : 'times'}`;
return <div className={iconClass} />;

// OK: どちらのクラスも確定的に見える形にする
const iconClass = isChecked ? 'i-fa-solid:check' : 'i-fa-solid:times';

// OK: safelist に追加
// uno.config.ts
export default defineConfig({
  safelist: ['i-fa-solid:check', 'i-fa-solid:times'],
})
```

**対策**: UnoCSS 静的化後は必ず全アイコン・全動的クラスを VRT で確認する

---

### 2. タイムゾーンの二重変換 (2025 年で失格者あり)

**症状**: 時刻が 9 時間ズレる → 番組表が狂う → 失格

**原因**: UTC の日時を既に JST として解釈した後、さらに +9 時間してしまう

```ts
// NG: UTC の文字列を JST として解釈して、さらに変換
const jst = new Date(utcString); // UTC として解釈
const jst2 = dayjs(jst).add(9, 'hour'); // さらに +9h → 18 時間ズレ

// OK: タイムゾーンを明示的に指定
const jst = dayjs.utc(utcString).tz('Asia/Tokyo');
```

**対策**: 日時変換を変更した後は、表示される時刻を手動で確認する

---

### 3. レギュレーション違反 (毎年複数名が失格)

**症状**: スコアが無効化される

**事例**:
- CSS media query の min/max を誤って逆にした → フッターナビが PC/SP で反転 (2023 年)
- スクロール位置が保存されない → 番組遷移後に先頭に戻る (2025 年) ← **上位 14 名全員がこれで失格**
- 日時が 9 時間ズレている (2025 年)

**対策**:
1. **競技開始直後にレギュレーションを熟読する**
2. 競技終了 1 時間前には変更を止めて最終確認に専念
3. VRT だけでなく手動でも全ページ・全機能を確認

---

### 4. VRT の見落とし (2025 年で失格者あり)

**症状**: VRT は通っているが実際には UI が壊れている

**原因**: VRT の差分閾値 (例: 3%) がマスクしてしまう

```bash
# NG: 差分があっても小さければ許容
--threshold 0.03

# 対策: VRT 後に差分画像を目視確認する
# 特にアイコン・動的コンテンツを重点的に確認
```

**対策**: 複数の変更をまとめてコミットするのではなく、1 変更ごとに VRT を実行する

---

### 5. 計測対象ページの誤認識 (2022 年で 1 日ロス)

**症状**: ローカルでは最適化できているのにスコアが伸びない

**原因**: 計測ページを `/` だと思っていたが実際は `/:date` だった

**対策**: 競技開始直後に採点ページの URL を必ず確認する

---

### 6. スコア低下をバグと誤認 (2025 年で 5〜6 時間ロス)

**症状**: 最適化後にスコアが急落 → バグと思い込んで原因調査に時間を浪費

**原因**: 一部が高速化されることで Lighthouse の計測タイミングがずれる場合がある

**対策**:
- スコアが下がっても慌てない
- 複数回計測して平均を取る (25〜100 点の振れ幅は正常)
- UI が正常かを先に確認する

---

### 7. jQuery 削除時の `DOMContentLoaded` タイミング問題 (毎年発生)

**症状**: 全ページが真っ白になる

**原因**: `$(document).ready()` の代替として `DOMContentLoaded` を使う際、イベント発火タイミングがずれる

```ts
// NG: タイミングによって発火しない
document.addEventListener('DOMContentLoaded', main);

// OK: 既に DOM が構築済みの場合を考慮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
```

---

### 8. Brotli 圧縮のサーバー遅延 (複数年で revert 事例あり)

**症状**: 圧縮を有効化したのにスコアが下がる

**原因**: サーバーサイドでのリアルタイム Brotli 圧縮は CPU 負荷が高く、TTFB が増加する

**対策**:
- 事前圧縮 (pre-compressed) を使う
- または Cloudflare に Brotli を任せる
- gzip から始めて、改善幅を確認してから Brotli を検討

---

### 9. axios → fetch の挙動差異 (2023〜2024 年で発生)

**症状**: ネットワークエラー時の動作が変わる・残高不足エラーが表示されない

**原因**: axios は HTTP エラー (4xx/5xx) を自動的に例外として throw するが、fetch はしない

```ts
// NG: fetch はステータスコードを自動チェックしない
const res = await fetch('/api/data');
const data = await res.json(); // エラーでも json を試みる

// OK: ステータスを確認
const res = await fetch('/api/data');
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
```

---

### 10. treeshake が Service Worker を壊す (2024 年で発生)

**症状**: Service Worker が動作しなくなる

**原因**: tsup の `treeshake: true` が Service Worker のエントリーポイントに影響

**対策**: Service Worker は treeshake の対象外に設定するか、treeshake を無効化して個別最適化

---

### 11. Cloudflare ↔ オリジン間の HTTP/HTTPS ループ (nissy 氏)

**症状**: Cloudflare 経由でアクセスすると無限リダイレクト

**原因**: Cloudflare のエッジは HTTP でオリジンに接続するが、オリジンが HTTPS を強制するとループが発生

**対策**: Cloudflare の SSL/TLS モードを `Full` または `Full (Strict)` に設定する

**補足**: Vercel はデプロイごとに HTTP → HTTPS (308) にリダイレクトするが、Cloudflare CDN を前段に置くとキャッシュを自動パージできなくなる。Vercel + Cloudflare の組み合わせは基本的に非推奨。

---

### 12. VRT のスクリーンショットが OS によって異なる (複数年で発生)

**症状**: 変更していないのに VRT に差分が出る・macOS 産と Linux 産のスナップショットが不一致

**原因**: フォントレンダリング・アンチエイリアス・サブピクセル処理が OS によって異なる

**対策**:
- スナップショットは必ず同一 OS で生成する
- GitHub Actions (Linux) 環境でのスナップショットをベースラインにする

```bash
# スナップショットを CI (Linux) で再生成
npx playwright test --update-snapshots

# ローカルは差分確認のみ (生成はしない)
npx playwright test
```

---

### 13. Google App Engine で yarn が動かない (nissy 氏)

**症状**: Standard 環境で yarn コマンドが失敗する

**対策**: Flexible 環境を使用する

---

### 14. Heroku の無料プランで HTTP/2 が使えない (2022 年)

**症状**: HTTP/2 による並列ダウンロード効果がない → 満点に届かない

**対策**: Cloudflare を前段に置く、または Linode/VPS に移行

---

### 15. styled-components と Streaming SSR の非互換

**症状**: SSR をストリーミングに移行しようとするとスタイルが壊れる

**原因**: `styled-components` は `renderToPipeableStream()` に対応していない

**対策**: `renderToString()` を使うか、Emotion や vanilla-extract など他のライブラリに移行する

---

### 16. `getBoundingClientRect()` の連続呼び出し (2025 年で確認)

**症状**: TBT が高止まり、CPU 負荷が継続的に高い

**原因**: `Hoverable` コンポーネントが毎フレーム `getBoundingClientRect()` を呼び出してマウス座標と要素位置を比較していた (累計 2000ms の CPU ブロッキング)

**対策**: `mouseenter` / `mouseleave` イベントを直接リッスンして座標計算を排除する

```tsx
// NG: 毎フレーム getBoundingClientRect() を呼んで座標計算
// OK: mouseenter / mouseleave で直接制御
element.addEventListener('mouseenter', () => setHovered(true));
element.addEventListener('mouseleave', () => setHovered(false));
```

---

### 17. `react-ellipsis-component` の CPU 負荷 (2025 年)

**症状**: 画面内の長いテキストがある限り CPU が休まらない

**原因**: `react-ellipsis-component` が内部で要素の高さを常時監視している

**対策**: CSS `text-overflow: ellipsis` に置き換える (VRT に注意)

```css
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## 「やったけど効果がなかった」パターン

| 施策 | 理由 | 対処法 |
|------|------|--------|
| Noto Sans JP サブセット化 | そもそも使われていなかった | まず使用フォントを確認 |
| SSR 実装 | API レスポンスが遅くて TTFB が増加 | API を先に最適化 |
| Brotli 圧縮 (サーバーサイドリアルタイム) | CPU 負荷でレスポンス遅延 | Cloudflare に任せる / 事前圧縮 |
| コード分割 | バンドルサイズが既に肥大化していた | サイズ削減が先 |
| React.lazy 多用 | TTI・TBT を逆に悪化させる場合あり | Suspense の使い方を慎重に |
| Vite 移行 | WASM の互換性問題で断念した事例あり | Rspack 移行の方が安全な場合も |
| Next.js 移行 | 移行コストが高く時間を消費 | 既存フレームワークの最適化を優先 |
| `preload` 多用 | 他リソースをブロックして逆効果 | LCP 画像 1 枚のみに絞る |

---

## VRT 環境構築のアドバイス

VRT は競技中の最重要ツール。毎変更後に自動実行できる環境を序盤に整える。

```bash
# Playwright VRT の基本
npx playwright test --update-snapshots  # 初回ベースライン作成
npx playwright test                      # 変更後の差分確認

# 環境差異による偽陽性を防ぐために
# - OS を統一する (macOS/Linux 混在は NG)
# - フォント差異に注意 (WSL と macOS は結果が違う)
# - ヘッドレスモードで実行する
```

---

## スコアの計測に関する落とし穴

### ブレ幅 (常時)

- スコアのブレ幅は **25〜100 点** が正常範囲
- 1 回の計測でスコアが下がっても慌てない
- 複数回計測して平均・最高値を把握する
- モバイル計測はデスクトップより厳しい (デスクトップ 100 点 → モバイル 70 点の事例あり)

### ローカル計測スコア ≠ リーダーボードスコア

- ローカル Lighthouse: 計測環境が緩い (パソコンスペック・回線速度の影響)
- リーダーボード: GitHub Actions の CI 環境 + 低速回線シミュレーション
- 差異が出て当然。本番スコアはリーダーボードで確認

### 2025 年の条件付きスコア

- ページ表示スコアが **200 点未満** の場合、ユーザーインタラクション (200 点) と動画再生 (100 点) は計測されずに 0 点になる
- まず 200 点を超えることを優先する

---

## 最終確認チェックリスト (競技終了 30 分前)

→ [checklist.md の Phase 8](./checklist.md#phase-8-最終確認-絶対に省略しない) を参照。
