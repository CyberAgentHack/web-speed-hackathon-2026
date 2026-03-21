import { relations } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// --- Tables ---

export const profileImages = sqliteTable("ProfileImages", {
  id: text("id").primaryKey().notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const users = sqliteTable(
  "Users",
  {
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
  },
  (table) => [index("idx_users_profile_image_id").on(table.profileImageId)],
);

export const movies = sqliteTable("Movies", {
  id: text("id").primaryKey().notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const sounds = sqliteTable("Sounds", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull().default("Unknown"),
  artist: text("artist").notNull().default("Unknown"),
  max: real("max").notNull(),
  peaks: text("peaks", { mode: "json" }).notNull().$type<number[]>(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const posts = sqliteTable(
  "Posts",
  {
    id: text("id").primaryKey().notNull(),
    text: text("text").notNull(),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    movieId: text("movieId").references(() => movies.id, { onDelete: "set null", onUpdate: "cascade" }),
    soundId: text("soundId").references(() => sounds.id, { onDelete: "set null", onUpdate: "cascade" }),
  },
  (table) => [
    index("idx_posts_user_id").on(table.userId),
    index("idx_posts_created_at").on(table.createdAt),
  ],
);

export const images = sqliteTable("Images", {
  id: text("id").primaryKey().notNull(),
  alt: text("alt").notNull().default(""),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const comments = sqliteTable(
  "Comments",
  {
    id: text("id").primaryKey().notNull(),
    text: text("text").notNull(),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
    postId: text("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
  },
  (table) => [index("idx_comments_post_id").on(table.postId)],
);

export const postsImagesRelations = sqliteTable(
  "PostsImagesRelations",
  {
    imageId: text("imageId")
      .notNull()
      .references(() => images.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.imageId, table.postId] }),
    index("idx_posts_images_post_id").on(table.postId),
    index("idx_posts_images_image_id").on(table.imageId),
  ],
);

export const directMessageConversations = sqliteTable(
  "DirectMessageConversations",
  {
    id: text("id").primaryKey().notNull(),
    initiatorId: text("initiatorId")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    memberId: text("memberId")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
  },
  (table) => [
    index("idx_dm_conversations_initiator_id").on(table.initiatorId),
    index("idx_dm_conversations_member_id").on(table.memberId),
  ],
);

export const directMessages = sqliteTable(
  "DirectMessages",
  {
    id: text("id").primaryKey().notNull(),
    body: text("body").notNull(),
    isRead: integer("isRead").notNull().default(0),
    createdAt: text("createdAt").notNull(),
    updatedAt: text("updatedAt").notNull(),
    senderId: text("senderId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    conversationId: text("conversationId")
      .notNull()
      .references(() => directMessageConversations.id, { onUpdate: "cascade" }),
  },
  (table) => [
    index("idx_direct_messages_conversation_id").on(table.conversationId),
    index("idx_direct_messages_sender_is_read").on(table.senderId, table.isRead),
  ],
);

export const qaSuggestions = sqliteTable("qa_suggestions", {
  id: text("id").primaryKey().notNull(),
  question: text("question").notNull(),
});

// --- Relations ---

export const profileImagesRelations = relations(profileImages, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profileImage: one(profileImages, {
    fields: [users.profileImageId],
    references: [profileImages.id],
  }),
  posts: many(posts),
  sentMessages: many(directMessages),
  initiatedConversations: many(directMessageConversations, { relationName: "initiator" }),
  joinedConversations: many(directMessageConversations, { relationName: "member" }),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  movie: one(movies, { fields: [posts.movieId], references: [movies.id] }),
  sound: one(sounds, { fields: [posts.soundId], references: [sounds.id] }),
  postsToImages: many(postsImagesRelations),
  comments: many(comments),
}));

export const imagesRelations = relations(images, ({ many }) => ({
  postsToImages: many(postsImagesRelations),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  posts: many(posts),
}));

export const soundsRelations = relations(sounds, ({ many }) => ({
  posts: many(posts),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const postsImagesRelationsRelations = relations(postsImagesRelations, ({ one }) => ({
  post: one(posts, { fields: [postsImagesRelations.postId], references: [posts.id] }),
  image: one(images, { fields: [postsImagesRelations.imageId], references: [images.id] }),
}));

export const directMessageConversationsRelations = relations(directMessageConversations, ({ one, many }) => ({
  initiator: one(users, {
    fields: [directMessageConversations.initiatorId],
    references: [users.id],
    relationName: "initiator",
  }),
  member: one(users, {
    fields: [directMessageConversations.memberId],
    references: [users.id],
    relationName: "member",
  }),
  messages: many(directMessages),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, { fields: [directMessages.senderId], references: [users.id] }),
  conversation: one(directMessageConversations, {
    fields: [directMessages.conversationId],
    references: [directMessageConversations.id],
  }),
}));
