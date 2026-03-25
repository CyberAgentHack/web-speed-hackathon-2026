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

  // パフォーマンス改善: よく使うカラムにインデックスを追加
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts(userId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Posts(createdAt DESC)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments(postId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_text ON Posts(text)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conversation_id ON DirectMessages(conversationId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_sender_id ON DirectMessages(senderId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conv_initiator ON DirectMessageConversations(initiatorId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conv_member ON DirectMessageConversations(memberId)");

  // SQLite WAL mode for better concurrent read performance
  await _sequelize.query("PRAGMA journal_mode=WAL");
  await _sequelize.query("PRAGMA synchronous=NORMAL");
}
