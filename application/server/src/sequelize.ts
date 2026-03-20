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
  await createIndexes(_sequelize);
}

async function createIndexes(sequelize: Sequelize) {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts (userId)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Posts (createdAt)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments (postId)`,
    `CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON DirectMessages (conversationId)`,
    `CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_is_read ON DirectMessages (senderId, isRead)`,
    `CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator_id ON DirectMessageConversations (initiatorId)`,
    `CREATE INDEX IF NOT EXISTS idx_dm_conversations_member_id ON DirectMessageConversations (memberId)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_images_post_id ON PostsImagesRelations (postId)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_images_image_id ON PostsImagesRelations (imageId)`,
    `CREATE INDEX IF NOT EXISTS idx_users_profile_image_id ON Users (profileImageId)`,
  ];

  await Promise.all(indexes.map((sql) => sequelize.query(sql)));
}
