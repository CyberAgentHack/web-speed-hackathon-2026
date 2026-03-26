# サーバー調査

## 構成
- **フレームワーク**: Express 5.1.0
- **ORM**: Sequelize 6.37.7 (SQLite3)
- **実行**: tsx (TypeScriptを直接実行、ビルドなし)
- **セッション**: express-session + MemoryStore
- **WebSocket**: ws ライブラリ

## エントリーポイント (src/index.ts)
1. database.sqlite をtmpにコピー
2. Sequelize初期化 + モデル定義
3. Express サーバー起動 (PORT=3000)

## API ルート一覧

| パス | メソッド | 概要 |
|------|---------|------|
| /api/v1/auth/signup | POST | ユーザー登録 |
| /api/v1/auth/signin | POST | ログイン |
| /api/v1/auth/signout | POST | ログアウト |
| /api/v1/me | GET/PUT | 自分の情報取得・更新 |
| /api/v1/users/:username | GET | ユーザー情報 |
| /api/v1/users/:username/posts | GET | ユーザー投稿一覧 |
| /api/v1/posts | GET/POST | 投稿一覧・作成 |
| /api/v1/posts/:postId | GET | 投稿詳細 |
| /api/v1/posts/:postId/comments | GET | コメント一覧 |
| /api/v1/images | POST | 画像アップロード (JPG) |
| /api/v1/movies | POST | 動画アップロード (GIF) |
| /api/v1/sounds | POST | 音声アップロード (MP3) |
| /api/v1/search | GET | 検索 (テキスト+日付フィルター) |
| /api/v1/dm | GET/POST | DM一覧・会話作成 |
| /api/v1/dm/:id/messages | POST | DM送信 |
| /api/v1/dm/:id/read | POST | 既読化 |
| /api/v1/dm/:id/typing | POST | タイピング通知 |
| /api/v1/dm/unread/ws | WS | 未読数リアルタイム |
| /api/v1/dm/:id/ws | WS | DM リアルタイム |
| /api/v1/crok/suggestions | GET | QA提案一覧 |
| /api/v1/crok | GET | AIチャット (SSE) |
| /api/v1/initialize | POST | DB初期化 |

## データベースモデル (12個)
User, Post, Comment, Image, Movie, Sound, ProfileImage, PostsImagesRelation, DirectMessage, DirectMessageConversation, QaSuggestion

## シードデータ (計92MB)
- users: 100件
- posts: 3,000件
- comments: 46,107件
- directMessages: 198,844件 (80MB)
- directMessageConversations: 499件
- images: 30件, movies: 15件, sounds: 15件
- qaSuggestions: 1,202件

## パフォーマンス問題

### 重大
1. **defaultScopeの過剰include** - Post取得時にuser/profileImage/images/movie/soundを常にJOIN → N+1問題
2. **HTTPキャッシュ完全無効** - Cache-Control: max-age=0, ETag/LastModified無効
3. **DB起動時コピー** - 94MBのSQLiteを毎回tmpにコピー
4. **検索の非効率** - 2回クエリ実行 + メモリ上で重複排除・ソート
5. **Crokの固定遅延** - TTFT 3秒 + 文字ごと10ms sleep
6. **bcrypt.genSaltSync** - 同期呼び出しでブロッキング
7. **DirectMessage afterSave hook** - 保存時に毎回追加DB3クエリ
