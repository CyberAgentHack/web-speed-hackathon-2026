import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

let _client: Client | null = null;
let _db: Database | null = null;

export function getDb(): Database {
  if (_db === null) {
    throw new Error("Database is not initialized. Call initializeDatabase() first.");
  }
  return _db;
}

export async function initializeDatabase() {
  _db = null;
  _client?.close();
  _client = null;

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  _client = createClient({ url: `file:${TEMP_PATH}` });
  _db = drizzle(_client, { schema });
}
