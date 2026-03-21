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
  await _sequelize.query("PRAGMA journal_mode=WAL;");
  await _sequelize.query("PRAGMA synchronous=NORMAL;");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_userId ON Posts(userId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON Posts(createdAt);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_postId ON Comments(postId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conversationId ON DirectMessages(conversationId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_senderId ON DirectMessages(senderId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_isRead ON DirectMessages(isRead);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dmc_initiatorId ON DirectMessageConversations(initiatorId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dmc_memberId ON DirectMessageConversations(memberId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_users_profileImageId ON Users(profileImageId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_movieId ON Posts(movieId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_soundId ON Posts(soundId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_pir_postId ON PostsImagesRelations(postId);");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_pir_imageId ON PostsImagesRelations(imageId);");
}
