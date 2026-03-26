// @ts-nocheck
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import {
  Comment,
  DirectMessage,
  DirectMessageConversation,
  Image,
  Movie,
  Post,
  PostsImagesRelation,
  ProfileImage,
  QaSuggestion,
  Sound,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.resolve(__dirname, "../seeds");
const imagesDir = path.join(PUBLIC_PATH, "images");

function extractExifAlt(buf: Buffer): string {
  let offset = 2;
  while (offset < buf.length - 1) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    const segLen = buf.readUInt16BE(offset + 2);
    if (marker === 0xe1) {
      const exifData = buf.subarray(offset + 4, offset + 2 + segLen);
      if (exifData.subarray(0, 4).toString("ascii") !== "Exif") break;
      const tiffStart = 6;
      const isBE = exifData.subarray(tiffStart, tiffStart + 2).toString("ascii") === "MM";
      const readU16 = (pos: number) => (isBE ? exifData.readUInt16BE(pos) : exifData.readUInt16LE(pos));
      const readU32 = (pos: number) => (isBE ? exifData.readUInt32BE(pos) : exifData.readUInt32LE(pos));
      const ifdOffset = readU32(tiffStart + 4);
      const numEntries = readU16(tiffStart + ifdOffset);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
        if (readU16(entryOffset) === 0x010e) {
          const count = readU32(entryOffset + 4);
          const valueOffset = count <= 4 ? entryOffset + 8 : tiffStart + readU32(entryOffset + 8);
          return exifData.subarray(valueOffset, valueOffset + count).toString("utf-8").replace(/\0$/, "");
        }
      }
      break;
    }
    offset += 2 + segLen;
  }
  return "";
}

const DEFAULT_BATCH_SIZE = 1000;

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

export async function insertSeeds(sequelize: Sequelize) {
  await sequelize.transaction(async (transaction) => {
    await readJsonlFileBatched<ProfileImageSeed>("profileImages.jsonl", async (batch) => {
      await ProfileImage.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<ImageSeed>("images.jsonl", async (batch) => {
      const withAlt = await Promise.all(
        batch.map(async (record) => {
          const imgPath = path.join(imagesDir, `${record.id}.jpg`);
          try {
            const buf = await fs.readFile(imgPath);
            return { ...record, alt: extractExifAlt(buf) || record.alt };
          } catch {
            return record;
          }
        }),
      );
      await Image.bulkCreate(withAlt, { transaction });
    });
    await readJsonlFileBatched<MovieSeed>("movies.jsonl", async (batch) => {
      await Movie.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<SoundSeed>("sounds.jsonl", async (batch) => {
      await Sound.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<UserSeed>("users.jsonl", async (batch) => {
      await User.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<PostSeed>("posts.jsonl", async (batch) => {
      await Post.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<PostsImagesRelationSeed>(
      "postsImagesRelation.jsonl",
      async (batch) => {
        await PostsImagesRelation.bulkCreate(batch, { transaction });
      },
    );
    await readJsonlFileBatched<CommentSeed>("comments.jsonl", async (batch) => {
      await Comment.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<DirectMessageConversationSeed>(
      "directMessageConversations.jsonl",
      async (batch) => {
        await DirectMessageConversation.bulkCreate(batch, { transaction });
      },
    );
    await readJsonlFileBatched<DirectMessageSeed>("directMessages.jsonl", async (batch) => {
      await DirectMessage.bulkCreate(batch, { transaction });
    });
    await readJsonlFileBatched<QaSuggestionSeed>("qaSuggestions.jsonl", async (batch) => {
      await QaSuggestion.bulkCreate(batch, { transaction });
    });
  });
}
