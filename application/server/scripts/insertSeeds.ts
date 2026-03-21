import * as fs from "node:fs/promises";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { pushSQLiteSchema } from "drizzle-kit/api";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { insertSeeds } from "@web-speed-hackathon-2026/server/src/seeds";

import * as schema from "../src/db/schema";

await fs.rm(DATABASE_PATH, { force: true, recursive: true });

const client = createClient({ url: `file:${DATABASE_PATH}` });
const db = drizzle(client, { schema });

// Push schema to database
const { apply } = await pushSQLiteSchema(schema, db as any);
await apply();

await insertSeeds(db);

client.close();
