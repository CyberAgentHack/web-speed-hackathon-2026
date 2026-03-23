import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

async function createIndexes(sequelize: Sequelize) {
  const indexDDL = [
    "CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON Comments(postId, createdAt ASC)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator_id ON DirectMessageConversations(initiatorId)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_member_id ON DirectMessageConversations(memberId)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversation_id_created_at ON DirectMessages(conversationId, createdAt ASC)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversation_sender_is_read ON DirectMessages(conversationId, senderId, isRead)",
  ];

  for (const ddl of indexDDL) {
    await sequelize.query(ddl);
  }
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
  await createIndexes(_sequelize);
}
