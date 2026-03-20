import * as fs from "node:fs/promises";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { insertSeeds } from "@web-speed-hackathon-2026/server/src/seeds";

await fs.rm(DATABASE_PATH, { force: true, recursive: true });

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma("journal_mode = WAL");

// Create tables using the exact schema from Sequelize-generated database
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "ProfileImages" (
    "alt" VARCHAR(255) NOT NULL DEFAULT '',
    "id" UUID NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "Users" (
    "description" VARCHAR(255) NOT NULL DEFAULT '',
    "id" UUID NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "profileImageId" UUID NOT NULL DEFAULT '396fe4ce-aa36-4d96-b54e-6db40bae2eed' REFERENCES "ProfileImages" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
  );
  CREATE TABLE IF NOT EXISTS "Images" (
    "alt" VARCHAR(255) NOT NULL DEFAULT '',
    "id" UUID NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "Movies" (
    "id" UUID NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "Sounds" (
    "artist" VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    "id" UUID NOT NULL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "Posts" (
    "id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "text" VARCHAR(255) NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "userId" UUID NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "movieId" UUID REFERENCES "Movies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "soundId" UUID REFERENCES "Sounds" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
  CREATE TABLE IF NOT EXISTS "PostsImagesRelations" (
    "imageId" UUID NOT NULL REFERENCES "Images" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "postId" VARCHAR(255) NOT NULL REFERENCES "Posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("imageId", "postId")
  );
  CREATE TABLE IF NOT EXISTS "Comments" (
    "id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "text" VARCHAR(255) NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "postId" VARCHAR(255) NOT NULL REFERENCES "Posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" UUID NOT NULL REFERENCES "Users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
  );
  CREATE TABLE IF NOT EXISTS "DirectMessageConversations" (
    "id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "initiatorId" VARCHAR(255) NOT NULL REFERENCES "Users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    "memberId" VARCHAR(255) NOT NULL REFERENCES "Users" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "DirectMessages" (
    "id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "isRead" TINYINT(1) NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "senderId" UUID NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "conversationId" VARCHAR(255) NOT NULL REFERENCES "DirectMessageConversations" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
  );
  CREATE TABLE IF NOT EXISTS "qa_suggestions" (
    "id" UUID NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL
  );
`);

const db = drizzle(sqlite);
await insertSeeds(db, sqlite);

sqlite.close();
console.log("Seeds inserted successfully");
