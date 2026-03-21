// @ts-nocheck
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";

import { SEEDS_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type {
  CommentSeed,
  DirectMessageConversationSeed,
  DirectMessageSeed,
  ImageSeed,
  MovieSeed,
  PostSeed,
  PostsImagesRelationSeed,
  ProfileImageSeed,
  QaSuggestionSeed,
  SoundSeed,
  UserSeed,
} from "@web-speed-hackathon-2026/server/src/types/seed";

import bcrypt from "bcrypt";

import type { Database } from "./db/client";
import * as schema from "./db/schema";

const seedsDir = SEEDS_PATH;

const DEFAULT_BATCH_SIZE = 100;

async function readJsonlFileBatched<T>(
  filename: string,
  callback: (batch: T[]) => Promise<void>,
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
        await callback(batch);
        batch = [];
      }
    } catch {
      console.error(`Error parsing JSON in ${filename} at line ${lineNumber}`);
      throw new Error(`Invalid JSONL format in ${filename} at line ${lineNumber}`);
    }
  }

  if (batch.length > 0) {
    await callback(batch);
  }
}

function now() {
  return new Date().toISOString();
}

export async function insertSeeds(db: Database) {
  await readJsonlFileBatched<ProfileImageSeed>("profileImages.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.profileImages).values(batch.map((b) => ({ ...b, createdAt: ts, updatedAt: ts })));
  });
  await readJsonlFileBatched<ImageSeed>("images.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.images).values(batch.map((b) => ({ ...b, updatedAt: ts })));
  });
  await readJsonlFileBatched<MovieSeed>("movies.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.movies).values(batch.map((b) => ({ ...b, createdAt: ts, updatedAt: ts })));
  });
  await readJsonlFileBatched<SoundSeed>("sounds.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.sounds).values(batch.map((b) => ({ ...b, createdAt: ts, updatedAt: ts })));
  });
  await readJsonlFileBatched<UserSeed>("users.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.users).values(
      batch.map((b) => ({
        ...b,
        password: bcrypt.hashSync(b.password, bcrypt.genSaltSync(8)),
        updatedAt: ts,
      })),
    );
  });
  await readJsonlFileBatched<PostSeed>("posts.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.posts).values(batch.map((b) => ({ ...b, updatedAt: ts })));
  });
  await readJsonlFileBatched<PostsImagesRelationSeed>("postsImagesRelation.jsonl", async (batch) => {
    const ts = now();
    await db
      .insert(schema.postsImagesRelations)
      .values(batch.map((b) => ({ ...b, createdAt: ts, updatedAt: ts })));
  });
  await readJsonlFileBatched<CommentSeed>("comments.jsonl", async (batch) => {
    const ts = now();
    await db.insert(schema.comments).values(batch.map((b) => ({ ...b, updatedAt: ts })));
  });
  await readJsonlFileBatched<DirectMessageConversationSeed>(
    "directMessageConversations.jsonl",
    async (batch) => {
      const ts = now();
      await db
        .insert(schema.directMessageConversations)
        .values(batch.map((b) => ({ ...b, createdAt: ts, updatedAt: ts })));
    },
  );
  await readJsonlFileBatched<DirectMessageSeed>("directMessages.jsonl", async (batch) => {
    await db.insert(schema.directMessages).values(
      batch.map((b) => ({
        ...b,
        isRead: typeof b.isRead === "boolean" ? (b.isRead ? 1 : 0) : Number(b.isRead),
      })),
    );
  });
  await readJsonlFileBatched<QaSuggestionSeed>("qaSuggestions.jsonl", async (batch) => {
    await db.insert(schema.qaSuggestions).values(batch);
  });
}
