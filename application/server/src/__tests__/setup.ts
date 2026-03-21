import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { pushSQLiteSchema } from "drizzle-kit/api";

import * as schema from "../db/schema";
import { insertSeeds } from "@web-speed-hackathon-2026/server/src/seeds";

let testDbPath: string;

export async function createTestDatabase(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-test-"));
  testDbPath = path.resolve(tmpDir, "database.sqlite");

  const client = createClient({ url: `file:${testDbPath}` });
  const db = drizzle(client, { schema });

  const { apply } = await pushSQLiteSchema(schema, db as any);
  await apply();

  await insertSeeds(db);
  client.close();

  return testDbPath;
}

export async function startServer(): Promise<{ server: Server; baseUrl: string }> {
  // Set DATABASE_PATH before importing app/sequelize
  process.env["DATABASE_PATH"] = testDbPath;

  // Dynamic import to pick up env var
  await import("@web-speed-hackathon-2026/server/src/utils/express_websocket_support");
  const { app } = await import("@web-speed-hackathon-2026/server/src/app");
  const { initializeDatabase } = await import("../../src/db/client");

  await initializeDatabase();

  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

/** Sign in and return the cookie string for authenticated requests */
export async function signIn(
  baseUrl: string,
  username: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    redirect: "manual",
  });
  if (!res.ok) {
    throw new Error(`signIn failed: ${res.status}`);
  }
  const setCookies = res.headers.getSetCookie();
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}
