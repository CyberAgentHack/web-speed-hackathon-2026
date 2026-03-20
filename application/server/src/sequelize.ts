import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

const SQLITE_TUNING_QUERIES = [
  'CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "Posts" ("createdAt" DESC)',
  'CREATE INDEX IF NOT EXISTS "idx_posts_user_id_created_at" ON "Posts" ("userId", "createdAt" DESC)',
  'CREATE INDEX IF NOT EXISTS "idx_comments_post_id_created_at" ON "Comments" ("postId", "createdAt" ASC)',
  'CREATE INDEX IF NOT EXISTS "idx_direct_messages_conversation_created_at" ON "DirectMessages" ("conversationId", "createdAt" ASC)',
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
  await Promise.all(SQLITE_TUNING_QUERIES.map((query) => _sequelize!.query(query)));
}
