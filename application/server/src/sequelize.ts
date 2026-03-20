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
  if (prevSequelize) {
    try {
      await prevSequelize.close();
    } catch (e) {
      console.error("Failed to close previous sequelize:", e);
    }
  }

  const tmpDir = path.resolve(os.tmpdir(), "./wsh-");
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (e) {
    // Ignore if already exists
  }

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.join(tmpDir, "db-")),
    "./database.sqlite",
  );

  try {
    await fs.copyFile(DATABASE_PATH, TEMP_PATH);
  } catch (e) {
    console.error("Failed to copy database file:", e);
    throw e;
  }

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });

  try {
    // Enable WAL mode for better performance
    await _sequelize.query("PRAGMA journal_mode = WAL;");
    await _sequelize.query("PRAGMA synchronous = NORMAL;");
    await _sequelize.query("PRAGMA cache_size = -10000;"); // 10MB cache

    // Add indexes
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_userId ON Posts(userId);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON Posts(createdAt);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_users_name ON Users(name);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_postId ON Comments(postId);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conversationId ON DirectMessages(conversationId);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_createdAt ON DirectMessages(createdAt);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dmc_initiatorId ON DirectMessageConversations(initiatorId);");
    await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dmc_memberId ON DirectMessageConversations(memberId);");
  } catch (e) {
    console.error("Failed to optimize SQLite or create indexes:", e);
    // Continue even if optimization fails
  }

  initModels(_sequelize);
}
