import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

async function createIndexes(sequelize: Sequelize) {
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments (postId)",
    "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Posts (createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts (userId)",
    "CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created ON DirectMessages (conversationId, createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_posts_images_relations_post_id ON PostsImagesRelations (postId)",
  ];
  for (const sql of indexes) {
    await sequelize.query(sql);
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
