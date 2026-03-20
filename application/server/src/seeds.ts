import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import type { Database } from "bun:sqlite";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import {
  comments,
  directMessageConversations,
  directMessages,
  images,
  movies,
  posts,
  postsImagesRelations,
  profileImages,
  qaSuggestions,
  sounds,
  users,
} from "@web-speed-hackathon-2026/server/src/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.resolve(__dirname, "../seeds");

const DEFAULT_BATCH_SIZE = 1000;

async function readJsonlFileBatched<T>(
  filename: string,
  callback: (batch: T[]) => void,
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<void> {
  const filePath = path.join(seedsDir, filename);

  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Seed file not found: ${filename}`);
  }

  const fileStream = createReadStream(filePath, { encoding: "utf8" });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let batch: T[] = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    try {
      batch.push(JSON.parse(trimmedLine));

      if (batch.length >= batchSize) {
        callback(batch);
        batch = [];
      }
    } catch {
      console.error(`Error parsing JSON in ${filename} at line ${lineNumber}`);
      throw new Error(`Invalid JSONL format in ${filename} at line ${lineNumber}`);
    }
  }

  if (batch.length > 0) {
    callback(batch);
  }
}

function fillTimestamps<T extends Record<string, unknown>>(
  row: T,
  now: string,
): T & { createdAt: string; updatedAt: string } {
  return {
    ...row,
    createdAt: (row["createdAt"] as string) ?? now,
    updatedAt: (row["updatedAt"] as string) ?? (row["createdAt"] as string) ?? now,
  };
}

export async function insertSeeds(db: BunSQLiteDatabase, sqlite: Database) {
  const now = new Date().toISOString();

  // Collect all data first (async JSONL reads), then insert in a sync transaction
  const allData: { table: string; rows: Record<string, unknown>[] }[] = [];

  await readJsonlFileBatched<Record<string, unknown>>("profileImages.jsonl", (batch) => {
    allData.push({ table: "profileImages", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("images.jsonl", (batch) => {
    allData.push({ table: "images", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("movies.jsonl", (batch) => {
    allData.push({ table: "movies", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("sounds.jsonl", (batch) => {
    allData.push({ table: "sounds", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("users.jsonl", (batch) => {
    allData.push({
      table: "users",
      rows: batch.map((r) => ({
        ...fillTimestamps(r, now),
        password: Bun.password.hashSync(r["password"] as string, { algorithm: "bcrypt", cost: 8 }),
      })),
    });
  });
  await readJsonlFileBatched<Record<string, unknown>>("posts.jsonl", (batch) => {
    allData.push({
      table: "posts",
      rows: batch.map((r) => ({
        ...fillTimestamps(r, now),
        movieId: (r["movieId"] as string) ?? null,
        soundId: (r["soundId"] as string) ?? null,
      })),
    });
  });
  await readJsonlFileBatched<Record<string, unknown>>("postsImagesRelation.jsonl", (batch) => {
    allData.push({ table: "postsImagesRelations", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("comments.jsonl", (batch) => {
    allData.push({ table: "comments", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>(
    "directMessageConversations.jsonl",
    (batch) => {
      allData.push({
        table: "directMessageConversations",
        rows: batch.map((r) => fillTimestamps(r, now)),
      });
    },
  );
  await readJsonlFileBatched<Record<string, unknown>>("directMessages.jsonl", (batch) => {
    allData.push({ table: "directMessages", rows: batch.map((r) => fillTimestamps(r, now)) });
  });
  await readJsonlFileBatched<Record<string, unknown>>("qaSuggestions.jsonl", (batch) => {
    allData.push({ table: "qaSuggestions", rows: batch });
  });

  const tableMap: Record<string, any> = {
    profileImages,
    images,
    movies,
    sounds,
    users,
    posts,
    postsImagesRelations,
    comments,
    directMessageConversations,
    directMessages,
    qaSuggestions,
  };

  sqlite.transaction(() => {
    for (const { table, rows } of allData) {
      const schema = tableMap[table];
      if (rows.length > 0) {
        db.insert(schema).values(rows).run();
      }
    }
  })();
}
