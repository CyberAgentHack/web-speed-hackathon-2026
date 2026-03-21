import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: bun:sqlite is a Bun built-in not in @types
import { Database as BunSQLite } from "bun:sqlite";
import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// Sequelize's sqlite dialect expects the sqlite3 package's async callback API.
// bun:sqlite is synchronous. This shim wraps bun:sqlite to look like sqlite3
// so Sequelize can use it as a dialectModule.
class SqliteCompat {
  private _db!: BunSQLite;
  public filename!: string;
  public uuid?: string;

  constructor(filename: string, _mode?: number, callback?: (err: Error | null) => void) {
    try {
      this._db = new BunSQLite(filename);
      this.filename = filename;
      // Defer callback to allow Sequelize's assignment (this.connections[uuid] = new Database(...))
      // to complete before the callback resolves the promise with this.connections[uuid].
      // sqlite3's async constructor does this naturally; we must emulate it.
      if (callback) queueMicrotask(() => callback!(null));
    } catch (err) {
      if (callback) queueMicrotask(() => callback!(err as Error));
      else throw err;
    }
  }

  // sqlite3's serialize: runs callback immediately (bun:sqlite is synchronous)
  serialize(callback: () => void) {
    callback();
  }

  // sqlite3's run: for INSERT/UPDATE/DELETE/PRAGMA
  run(sql: string, params?: unknown, callback?: (this: { lastID: number; changes: number }, err: Error | null) => void) {
    if (typeof params === "function") {
      callback = params as typeof callback;
      params = undefined;
    }
    try {
      const stmt = this._db.prepare(sql);
      // bun:sqlite accepts array or object params
      const result = params != null ? stmt.run(params as Parameters<typeof stmt.run>[0]) : stmt.run();
      if (callback) {
        callback.call({ lastID: Number(result.lastInsertRowid), changes: result.changes }, null);
      }
    } catch (err) {
      if (callback) {
        callback.call({ lastID: 0, changes: 0 }, err as Error);
      }
    }
  }

  // sqlite3's all: for SELECT
  all(sql: string, params?: unknown, callback?: (err: Error | null, rows: unknown[]) => void) {
    if (typeof params === "function") {
      callback = params as typeof callback;
      params = undefined;
    }
    try {
      const stmt = this._db.prepare(sql);
      const rows = params != null ? stmt.all(params as Parameters<typeof stmt.all>[0]) : stmt.all();
      if (callback) callback(null, rows);
    } catch (err) {
      if (callback) callback(err as Error, []);
    }
  }

  // sqlite3's close
  close(callback?: (err: Error | null) => void) {
    try {
      this._db.close();
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err as Error);
    }
  }
}

// dialectModule shape that Sequelize's sqlite connection-manager expects
const dialectModule = {
  Database: SqliteCompat,
  OPEN_READONLY: 1,
  OPEN_READWRITE: 2,
  OPEN_CREATE: 4,
};

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
    dialectModule,
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
