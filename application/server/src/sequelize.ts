import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

async function ensurePerformanceIndexes(sequelize: Sequelize) {
  await Promise.all([
    sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_dm_conversation_created_at" ON "DirectMessages" ("conversationId", "createdAt" DESC);',
    ),
    sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_dm_conversation_is_read_sender" ON "DirectMessages" ("conversationId", "isRead", "senderId");',
    ),
    sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_dmc_initiator_member" ON "DirectMessageConversations" ("initiatorId", "memberId");',
    ),
    sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_dmc_member_initiator" ON "DirectMessageConversations" ("memberId", "initiatorId");',
    ),
  ]);
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
}
