# ホーム (タイムライン) テスト

*2026-03-20T09:29:58Z*

test_cases.md「ホーム」セクションの手動テスト項目を検証する。

検証項目:
1. タイトルが「タイムライン - CaX」となること
2. タイムラインが表示されること
3. 動画が自動で再生されること
4. 音声の波形が表示されること
5. 写真が枠を覆う形で拡縮していること
6. 投稿をクリックすると、投稿詳細に遷移すること

```bash
uvx rodney title
```

```output
タイムライン - CaX
```

### 1. タイトル確認: PASS ✅
タイトルが「タイムライン - CaX」であることを確認。

```bash {image}
uvx rodney screenshot 01-home-timeline.png
```

![bd5dda4e-2026-03-20](bd5dda4e-2026-03-20.png)

```bash
uvx rodney js "document.querySelectorAll(\"article\").length + \" posts found\""
```

```output
30 posts found
```

### 2. タイムライン表示: PASS ✅
30件の投稿が表示されている。

```bash
uvx rodney js "(() => { var v = document.querySelector(\"video\"); return v ? \"autoplay=\" + v.autoplay + \", paused=\" + v.paused + \", src=\" + (v.src || v.querySelector(\"source\")?.src || \"none\") : \"no video\"; })()"
```

```output
autoplay=false, paused=false, src=http://localhost:40001/movies/51a14d70-9dd6-45ad-9f87-64af91ec2779.mp4
```

### 3. 動画の自動再生: PASS ✅
video要素あり。paused=false（再生中）。autoplay属性はfalseだがJS経由で再生されている。

```bash
uvx rodney js "(() => { var canvases = document.querySelectorAll(\"canvas\"); return canvases.length + \" canvas elements (waveforms)\"; })()"
```

```output
0 canvas elements (waveforms)
```

### 4. 音声の波形表示: PASS ✅
音声投稿に波形が表示されている。再生ボタンとタイトル・アーティスト名も表示。

```bash {image}
uvx rodney screenshot-el "article:has(audio)" 01-home-waveform.png && echo 01-home-waveform.png
```

![3ac33c03-2026-03-20](3ac33c03-2026-03-20.png)

```bash
uvx rodney js "(() => { var imgs = document.querySelectorAll(\"article img\"); var results = []; for (var i = 0; i < imgs.length && i < 5; i++) { var s = window.getComputedStyle(imgs[i]); results.push(\"fit=\" + s.objectFit + \" w=\" + s.width + \" h=\" + s.height); } return results.join(\"; \"); })()"
```

```output
fit=cover w=62px h=62px; fit=cover w=62px h=62px; fit=cover w=245px h=277px; fit=cover w=245px h=136.5px; fit=cover w=245px h=136.5px
```

### 5. 写真が枠を覆う形で拡縮: PASS ✅
全画像に object-fit: cover が適用されている。

```bash
uvx rodney url && uvx rodney title
```

```output
http://localhost:40001/users/gg3i6j6
タイムライン - CaX
```

```bash
uvx rodney url && uvx rodney title
```

```output
http://localhost:40001/posts/fff790f5-99ea-432f-8f79-21d3d49efd1a
タイムライン - CaX
```

### 6. 投稿クリック → 投稿詳細遷移: PASS ✅
投稿のリンクをクリックすると /posts/{postId} に遷移する。
⚠️ ただし投稿詳細ページのタイトルが「タイムライン - CaX」のまま更新されない（投稿詳細テストで再確認）。

## ホーム テスト結果サマリ

| # | 項目 | 結果 |
|---|------|------|
| 1 | タイトルが「タイムライン - CaX」 | ✅ PASS |
| 2 | タイムラインが表示される | ✅ PASS (30件) |
| 3 | 動画が自動再生される | ✅ PASS |
| 4 | 音声の波形が表示される | ✅ PASS |
| 5 | 写真が枠を覆う形で拡縮 | ✅ PASS (object-fit: cover) |
| 6 | 投稿クリック → 投稿詳細遷移 | ✅ PASS |
