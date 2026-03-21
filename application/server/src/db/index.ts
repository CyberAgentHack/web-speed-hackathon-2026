import { Database } from "bun:sqlite";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { drizzle } from "drizzle-orm/bun-sqlite";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import * as relations from "./relations";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema & typeof relations>>;

let _db: DrizzleDb | null = null;
let _sqlite: Database | null = null;
let _initLock: Promise<void> | null = null;

export function getDb(): DrizzleDb {
  if (!_db) throw new Error("DB not initialized");
  return _db;
}

export function getSqlite(): Database {
  if (!_sqlite) throw new Error("SQLite not initialized");
  return _sqlite;
}

export function isInitializing(): boolean {
  return _initLock !== null;
}

export async function waitForInit(): Promise<void> {
  if (_initLock) await _initLock;
}

export async function initializeDb() {
  if (_initLock) await _initLock;

  let resolve: () => void;
  _initLock = new Promise<void>((r) => {
    resolve = r;
  });

  try {
    // Prepare new DB while old one is still serving requests
    const TEMP_PATH = path.resolve(
      await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
      "./database.sqlite",
    );
    await fs.copyFile(DATABASE_PATH, TEMP_PATH);

    const newSqlite = new Database(TEMP_PATH);
    newSqlite.exec("PRAGMA journal_mode = WAL");
    newSqlite.exec("PRAGMA foreign_keys = ON");
    newSqlite.exec("PRAGMA busy_timeout = 5000");
    newSqlite.exec("PRAGMA synchronous = NORMAL");
    newSqlite.exec("PRAGMA cache_size = -64000");
    newSqlite.exec("PRAGMA temp_store = MEMORY");
    newSqlite.exec("PRAGMA mmap_size = 30000000");

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
      "CREATE INDEX IF NOT EXISTS idx_dm_unread_conv ON DirectMessages (isRead, conversationId, senderId)",
    ];
    for (const sql of indexes) {
      newSqlite.exec(sql);
    }

    const newDb = drizzle(newSqlite, { schema: { ...schema, ...relations } });

    // Atomic swap: old DB stays valid until this point
    const prevSqlite = _sqlite;
    _db = newDb;
    _sqlite = newSqlite;

    // Close old DB after swap — in-flight sync queries already completed
    prevSqlite?.close();
  } finally {
    _initLock = null;
    resolve!();
  }
}
