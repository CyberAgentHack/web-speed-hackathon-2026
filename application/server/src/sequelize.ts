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

  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_posts_userId ON Posts(userId)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON Posts(createdAt DESC)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_comments_postId ON Comments(postId, createdAt ASC)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_dm_conv_created ON DirectMessages(conversationId, createdAt DESC)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_dm_sender_read ON DirectMessages(senderId, isRead)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_dm_conv_sender_read ON DirectMessages(conversationId, senderId, isRead)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_dmconv_initiator ON DirectMessageConversations(initiatorId)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_dmconv_member ON DirectMessageConversations(memberId)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_postimg_postId ON PostsImagesRelations(postId)`);
  await _sequelize.query(`CREATE INDEX IF NOT EXISTS idx_postimg_imageId ON PostsImagesRelations(imageId)`);

  await _sequelize.query("PRAGMA journal_mode=WAL");
  await _sequelize.query("PRAGMA synchronous=NORMAL");
  await _sequelize.query("PRAGMA cache_size=-20000");
  await _sequelize.query("PRAGMA temp_store=MEMORY");
}
