import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { backfillImageAlts } from "@web-speed-hackathon-2026/server/src/utils/image_alt";

let _sequelize: Sequelize | null = null;

async function ensurePerformanceIndexes(sequelize: Sequelize) {
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator_id ON `DirectMessageConversations` (`initiatorId`)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_member_id ON `DirectMessageConversations` (`memberId`)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created_at ON `DirectMessages` (`conversationId`, `createdAt` DESC)",
  );
  await sequelize.query(
    "CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_is_read_sender ON `DirectMessages` (`conversationId`, `isRead`, `senderId`)",
  );
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
  await ensurePerformanceIndexes(_sequelize);
  await backfillImageAlts();
}

export function getSequelize() {
  if (_sequelize == null) {
    throw new Error("Sequelize is not initialized");
  }

  return _sequelize;
}
