import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import * as relations from "./relations";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema & typeof relations>>;

let _db: DrizzleDb | null = null;
let _sqlite: Database.Database | null = null;

export function getDb(): DrizzleDb {
  if (!_db) throw new Error("DB not initialized");
  return _db;
}

export function getSqlite(): Database.Database {
  if (!_sqlite) throw new Error("SQLite not initialized");
  return _sqlite;
}

export async function initializeDb() {
  const prevSqlite = _sqlite;
  _db = null;
  _sqlite = null;
  prevSqlite?.close();

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  _sqlite = new Database(TEMP_PATH);
  _sqlite.pragma("journal_mode = WAL");

  _db = drizzle(_sqlite, { schema: { ...schema, ...relations } });

  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments (postId)",
    "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Posts (createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts (userId)",
    "CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created ON DirectMessages (conversationId, createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_posts_images_relations_post_id ON PostsImagesRelations (postId)",
  ];
  for (const sql of indexes) {
    _sqlite.exec(sql);
  }
}
