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

  // SQLite performance optimizations
  await _sequelize.query("PRAGMA journal_mode=WAL");
  await _sequelize.query("PRAGMA synchronous=NORMAL");
  await _sequelize.query("PRAGMA cache_size=-65536"); // 64MB page cache
  await _sequelize.query("PRAGMA temp_store=MEMORY");
  await _sequelize.query("PRAGMA mmap_size=134217728"); // 128MB memory-mapped I/O

  // Indexes on foreign keys (SQLite does NOT auto-create these)
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_userId ON Posts(userId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON Posts(createdAt)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_images_postId ON PostsImagesRelations(postId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_postId ON Comments(postId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_conversationId ON DirectMessages(conversationId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_dm_createdAt ON DirectMessages(createdAt)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username)");
}
