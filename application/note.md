#　Day1
## 1. バンドルでかすぎ問題
Webpack Bundle Analyzerでバンドルを分析。
- ffmpeg (41MB)
- imagemagick (18MB)
- mlc-ai (6MB)
- negaposi (わすれた)

とりあえずこれらはサーバーの機能にするか、他のライブラリで代替

これでもまだサイズはあるので、バンドルの分割を試みる
分割するとエラーが出るので、分割はしないで、それ以外をやる
- ブラウザはGoogleChromeの最新バージョンだけ
- 他でfalseになっている設定

## 2. 画像でかすぎ問題