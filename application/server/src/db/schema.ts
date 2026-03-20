import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const profileImages = sqliteTable("ProfileImages", {
  id: text("id").primaryKey().notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const users = sqliteTable("Users", {
  id: text("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  password: text("password").notNull(),
  profileImageId: text("profileImageId")
    .notNull()
    .default("396fe4ce-aa36-4d96-b54e-6db40bae2eed")
    .references(() => profileImages.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const images = sqliteTable("Images", {
  id: text("id").primaryKey().notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const movies = sqliteTable("Movies", {
  id: text("id").primaryKey().notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const sounds = sqliteTable("Sounds", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull().default("Unknown"),
  artist: text("artist").notNull().default("Unknown"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const posts = sqliteTable("Posts", {
  id: text("id").primaryKey().notNull(),
  text: text("text").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  movieId: text("movieId").references(() => movies.id),
  soundId: text("soundId").references(() => sounds.id),
});

export const postsImagesRelations = sqliteTable(
  "PostsImagesRelations",
  {
    imageId: text("imageId")
      .notNull()
      .references(() => images.id),
    postId: text("postId")
      .notNull()
      .references(() => posts.id),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [primaryKey({ columns: [table.imageId, table.postId] })],
);

export const comments = sqliteTable("Comments", {
  id: text("id").primaryKey().notNull(),
  text: text("text").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  postId: text("postId")
    .notNull()
    .references(() => posts.id),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
});

export const directMessageConversations = sqliteTable("DirectMessageConversations", {
  id: text("id").primaryKey().notNull(),
  initiatorId: text("initiatorId")
    .notNull()
    .references(() => users.id),
  memberId: text("memberId")
    .notNull()
    .references(() => users.id),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const directMessages = sqliteTable("DirectMessages", {
  id: text("id").primaryKey().notNull(),
  body: text("body").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  senderId: text("senderId")
    .notNull()
    .references(() => users.id),
  conversationId: text("conversationId")
    .notNull()
    .references(() => directMessageConversations.id),
});

export const qaSuggestions = sqliteTable("qa_suggestions", {
  id: text("id").primaryKey().notNull(),
  question: text("question").notNull(),
});
