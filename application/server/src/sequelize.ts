import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

/** /initialize でも再生成できるよう関数として定義 */
async function addIndexes(sequelize: Sequelize) {
  const queries = [
    // Posts
    'CREATE INDEX IF NOT EXISTS "idx_posts_userId"    ON "Posts"    ("userId")',
    'CREATE INDEX IF NOT EXISTS "idx_posts_createdAt" ON "Posts"    ("createdAt")',
    // Comments
    'CREATE INDEX IF NOT EXISTS "idx_comments_postId" ON "Comments" ("postId")',
    'CREATE INDEX IF NOT EXISTS "idx_comments_userId" ON "Comments" ("userId")',
    // DirectMessages
    'CREATE INDEX IF NOT EXISTS "idx_dm_conversationId" ON "DirectMessages" ("conversationId")',
    'CREATE INDEX IF NOT EXISTS "idx_dm_senderId"       ON "DirectMessages" ("senderId")',
    'CREATE INDEX IF NOT EXISTS "idx_dm_isRead"         ON "DirectMessages" ("isRead")',
    // 未読カウント複合インデックス
    'CREATE INDEX IF NOT EXISTS "idx_dm_unread" ON "DirectMessages" ("conversationId", "senderId", "isRead")',
    // DirectMessageConversations
    'CREATE INDEX IF NOT EXISTS "idx_dmc_initiatorId" ON "DirectMessageConversations" ("initiatorId")',
    'CREATE INDEX IF NOT EXISTS "idx_dmc_memberId"    ON "DirectMessageConversations" ("memberId")',
    // OR 条件用複合インデックス
    'CREATE INDEX IF NOT EXISTS "idx_dmc_members" ON "DirectMessageConversations" ("initiatorId", "memberId")',
    // PostsImagesRelations (中間テーブル)
    'CREATE INDEX IF NOT EXISTS "idx_pir_postId"  ON "PostsImagesRelations" ("postId")',
    'CREATE INDEX IF NOT EXISTS "idx_pir_imageId" ON "PostsImagesRelations" ("imageId")',
  ];

  await Promise.all(queries.map((sql) => sequelize.query(sql)));
}

export async function initializeSequelize() {
  const prevSequelize = _sequelize;
  _sequelize = null;
  await prevSequelize?.close();

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });
  initModels(_sequelize);
  await addIndexes(_sequelize);
}
