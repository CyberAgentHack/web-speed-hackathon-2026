import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

const indexes = [
  'CREATE INDEX IF NOT EXISTS "idx_posts_created_at_desc" ON "Posts" ("createdAt" DESC)',
  'CREATE INDEX IF NOT EXISTS "idx_posts_user_id_created_at_desc" ON "Posts" ("userId", "createdAt" DESC)',
  'CREATE INDEX IF NOT EXISTS "idx_comments_post_id_created_at_asc" ON "Comments" ("postId", "createdAt" ASC)',
  'CREATE INDEX IF NOT EXISTS "idx_direct_messages_conversation_created_at_asc" ON "DirectMessages" ("conversationId", "createdAt" ASC)',
  'CREATE INDEX IF NOT EXISTS "idx_direct_messages_unread_lookup" ON "DirectMessages" ("conversationId", "isRead", "senderId")',
  "PRAGMA optimize",
];

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
  await Promise.all(indexes.map((index) => _sequelize?.query(index)));
}
