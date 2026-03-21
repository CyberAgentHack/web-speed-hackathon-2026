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

  await _sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_posts_userId ON Posts (userId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON Posts (createdAt);
    CREATE INDEX IF NOT EXISTS idx_comments_postId ON Comments (postId);
    CREATE INDEX IF NOT EXISTS idx_comments_userId ON Comments (userId);
    CREATE INDEX IF NOT EXISTS idx_dm_conversationId ON DirectMessages (conversationId);
    CREATE INDEX IF NOT EXISTS idx_dm_senderId ON DirectMessages (senderId);
    CREATE INDEX IF NOT EXISTS idx_dm_isRead ON DirectMessages (isRead);
    CREATE INDEX IF NOT EXISTS idx_dm_conv_sender_read ON DirectMessages (conversationId, senderId, isRead);
    CREATE INDEX IF NOT EXISTS idx_dmc_initiatorId ON DirectMessageConversations (initiatorId);
    CREATE INDEX IF NOT EXISTS idx_dmc_memberId ON DirectMessageConversations (memberId);
    CREATE INDEX IF NOT EXISTS idx_pir_postId ON PostsImagesRelations (postId);
    CREATE INDEX IF NOT EXISTS idx_pir_imageId ON PostsImagesRelations (imageId);
  `);
}
