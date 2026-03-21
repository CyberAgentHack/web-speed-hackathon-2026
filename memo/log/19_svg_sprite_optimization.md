# 19. SVGスプライト最適化 (2026-03-21)

## 変更内容

Font Awesome の SVGスプライトファイルから未使用シンボルを除去。

### Before → After

| ファイル | Before | After | 削減 |
|---|---|---|---|
| solid.svg | 639KB (1002シンボル) | 7.2KB (17シンボル) | -99% |
| regular.svg | 107KB (152シンボル) | 986B (1シンボル) | -99% |
| brands.svg | 459KB (458シンボル) | 削除 (未使用) | -100% |
| **合計** | **1.2MB** | **8.2KB** | **-99.3%** |

### 残したシンボル

- **solid** (17): arrow-down, arrow-right, balance-scale, circle-notch, edit, envelope, exclamation-circle, home, images, music, paper-plane, pause, play, search, sign-in-alt, user, video
- **regular** (1): calendar-alt

### 方法

Python スクリプトで使用中のシンボル ID を正規表現で抽出し、新しいスプライトファイルを生成。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `public/sprites/font-awesome/solid.svg` | 1002 → 17 シンボルに削減 |
| `public/sprites/font-awesome/regular.svg` | 152 → 1 シンボルに削減 |
| `public/sprites/font-awesome/brands.svg` | 削除（未使用） |

## VRT 結果

変更前: 6 failed, 2 flaky, 44 passed
変更後: **7 failed, 5 flaky, 40 passed**（flakyテストの揺れのみ、新規失敗なし）
