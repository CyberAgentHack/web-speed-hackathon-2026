The score dropped after the last changes. DM pages are now broken:
- "DM一覧ページを開く | ユーザー名の入力に失敗"
- "DM詳細ページを開く | ユーザー名の入力に失敗"

Check what changed in the DM-related files and revert if necessary:
- application/client/src/components/direct_message/DirectMessagePage.tsx
- application/client/src/components/direct_message/DirectMessageListPage.tsx
- application/server/src/routes/api/direct_message.ts

Validate by running the app locally and checking DM functionality.
