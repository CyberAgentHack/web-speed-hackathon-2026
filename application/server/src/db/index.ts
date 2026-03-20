import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

// @ts-expect-error -- bun:sqlite is a Bun built-in module; oxlint cannot resolve it
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import * as relations from "./relations";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema & typeof relations>>;

let _db: DrizzleDb | null = null;
let _sqlite: Database | null = null;

export function getDb(): DrizzleDb {
  if (!_db) throw new Error("DB not initialized");
  return _db;
}

export function getSqlite(): Database {
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
  _sqlite.exec("PRAGMA journal_mode = WAL");
  _sqlite.exec("PRAGMA busy_timeout = 5000");
  _sqlite.exec("PRAGMA synchronous = NORMAL");
  _sqlite.exec("PRAGMA cache_size = -64000");
  _sqlite.exec("PRAGMA temp_store = MEMORY");
  _sqlite.exec("PRAGMA mmap_size = 30000000");

  _db = drizzle(_sqlite, { schema: { ...schema, ...relations } });

  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments (postId)",
    "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Posts (createdAt DESC)",
    "CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts (userId)",
    "CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created ON DirectMessages (conversationId, createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_posts_images_relations_post_id ON PostsImagesRelations (postId)",
    "CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_read ON DirectMessages (senderId, isRead)",
    "CREATE INDEX IF NOT EXISTS idx_comments_post_created ON Comments (postId, createdAt)",
    "CREATE INDEX IF NOT EXISTS idx_comments_user_id ON Comments (userId)",
    "CREATE INDEX IF NOT EXISTS idx_users_username ON Users (username)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_initiator ON DirectMessageConversations (initiatorId)",
    "CREATE INDEX IF NOT EXISTS idx_dm_conversations_member ON DirectMessageConversations (memberId)",
  ];
  for (const sql of indexes) {
    _sqlite.exec(sql);
  }
}
