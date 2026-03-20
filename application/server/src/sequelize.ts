import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import {
  Comment,
  DirectMessage,
  DirectMessageConversation,
  Post,
  PostsImagesRelation,
  initModels,
} from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

async function ensurePerformanceIndexes(sequelize: Sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  const indexDefinitions: Array<{
    fields: string[];
    name: string;
    tableName: string;
  }> = [
    {
      tableName: String(Post.getTableName()),
      fields: ["createdAt"],
      name: "idx_posts_created_at",
    },
    {
      tableName: String(Post.getTableName()),
      fields: ["userId", "createdAt"],
      name: "idx_posts_user_id_created_at",
    },
    {
      tableName: String(Comment.getTableName()),
      fields: ["postId", "createdAt"],
      name: "idx_comments_post_id_created_at",
    },
    {
      tableName: String(DirectMessage.getTableName()),
      fields: ["conversationId", "createdAt"],
      name: "idx_direct_messages_conversation_id_created_at",
    },
    {
      tableName: String(DirectMessage.getTableName()),
      fields: ["conversationId", "senderId", "isRead"],
      name: "idx_direct_messages_conversation_id_sender_id_is_read",
    },
    {
      tableName: String(DirectMessageConversation.getTableName()),
      fields: ["initiatorId", "memberId"],
      name: "idx_direct_message_conversations_initiator_member",
    },
    {
      tableName: String(PostsImagesRelation.getTableName()),
      fields: ["postId", "imageId"],
      name: "idx_posts_images_relations_post_id_image_id",
    },
  ];

  for (const { tableName, fields, name } of indexDefinitions) {
    try {
      await queryInterface.addIndex(tableName, fields, { name });
    } catch (error) {
      const message = String(error);
      if (message.includes("already exists")) {
        continue;
      }
      throw error;
    }
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
  await ensurePerformanceIndexes(_sequelize);
}
