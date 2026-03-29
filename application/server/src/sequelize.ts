import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

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

  await Promise.all([
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "posts_created_at_id" ON "Posts" ("createdAt", "id")`,
    ),
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "comments_post_id_created_at" ON "Comments" ("postId", "createdAt")`,
    ),
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "dm_conversation_id_created_at" ON "DirectMessages" ("conversationId", "createdAt")`,
    ),
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "dm_sender_id_is_read" ON "DirectMessages" ("senderId", "isRead")`,
    ),
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "dm_conv_initiator_id" ON "DirectMessageConversations" ("initiatorId")`,
    ),
    _sequelize.query(
      `CREATE INDEX IF NOT EXISTS "dm_conv_member_id" ON "DirectMessageConversations" ("memberId")`,
    ),
  ]);
}
