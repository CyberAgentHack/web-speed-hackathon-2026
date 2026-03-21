import { and, asc, countDistinct, desc, eq, exists, ne, or } from "drizzle-orm";

import type { Database } from "./client";
import * as schema from "./schema";

// --- User helpers ---

const userColumns = {
  id: true as const,
  username: true as const,
  name: true as const,
  description: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  password: false as const,
  profileImageId: false as const,
};

const userWith = {
  profileImage: true as const,
};

export async function findUserByPk(db: Database, id: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
    columns: userColumns,
    with: userWith,
  });
}

export async function findUserByUsername(db: Database, username: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.username, username),
    columns: userColumns,
    with: userWith,
  });
}

export async function findUserWithPassword(db: Database, username: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.username, username),
    columns: { ...userColumns, password: true as const },
    with: userWith,
  });
}

// --- Post helpers ---

const postWith = {
  user: { columns: userColumns, with: userWith },
  postsToImages: { with: { image: true as const } },
  movie: true as const,
  sound: true as const,
};

const postColumns = {
  id: true as const,
  text: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  userId: false as const,
  movieId: false as const,
  soundId: false as const,
};

export function transformPost(post: any) {
  if (!post) return post;
  const { postsToImages, ...rest } = post;
  return {
    ...rest,
    images: postsToImages?.map((r: any) => r.image) ?? [],
  };
}

export function transformPosts(posts: any[]) {
  return posts.map(transformPost);
}

export async function findPostByPk(db: Database, id: string) {
  const post = await db.query.posts.findFirst({
    where: eq(schema.posts.id, id),
    columns: postColumns,
    with: postWith,
  });
  return transformPost(post);
}

export async function findPosts(
  db: Database,
  opts: {
    where?: any;
    limit?: number;
    offset?: number;
    orderBy?: any;
  } = {},
) {
  const posts = await db.query.posts.findMany({
    columns: postColumns,
    with: postWith,
    orderBy: opts.orderBy ?? [desc(schema.posts.createdAt), desc(schema.posts.id)],
    where: opts.where,
    limit: opts.limit,
    offset: opts.offset,
  });
  return transformPosts(posts);
}

// --- Comment helpers ---

const commentColumns = {
  id: true as const,
  text: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  userId: false as const,
  postId: false as const,
};

const commentWith = {
  user: { columns: userColumns, with: userWith },
};

export async function findComments(
  db: Database,
  postId: string,
  opts: { limit?: number; offset?: number } = {},
) {
  return db.query.comments.findMany({
    columns: commentColumns,
    with: commentWith,
    where: eq(schema.comments.postId, postId),
    orderBy: [asc(schema.comments.createdAt)],
    limit: opts.limit,
    offset: opts.offset,
  });
}

// --- DirectMessage helpers ---

const dmSenderWith = {
  sender: { columns: userColumns, with: userWith },
};

const conversationWith = {
  initiator: { columns: userColumns, with: userWith },
  member: { columns: userColumns, with: userWith },
  messages: {
    with: dmSenderWith,
    orderBy: [asc(schema.directMessages.createdAt)],
  },
};

export async function findConversationByPk(db: Database, id: string) {
  return db.query.directMessageConversations.findFirst({
    where: eq(schema.directMessageConversations.id, id),
    with: conversationWith,
  });
}

export async function findConversationForUser(db: Database, conversationId: string, userId: string) {
  return db.query.directMessageConversations.findFirst({
    where: and(
      eq(schema.directMessageConversations.id, conversationId),
      or(
        eq(schema.directMessageConversations.initiatorId, userId),
        eq(schema.directMessageConversations.memberId, userId),
      ),
    ),
    with: conversationWith,
  });
}

export async function findConversationsForUser(db: Database, userId: string) {
  const convs = await db.query.directMessageConversations.findMany({
    where: and(
      or(
        eq(schema.directMessageConversations.initiatorId, userId),
        eq(schema.directMessageConversations.memberId, userId),
      ),
      exists(
        db
          .select({ id: schema.directMessages.id })
          .from(schema.directMessages)
          .where(eq(schema.directMessages.conversationId, schema.directMessageConversations.id)),
      ),
    ),
    with: conversationWith,
  });

  // Sort by latest message createdAt DESC
  convs.sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt ?? "";
    const bLast = b.messages[b.messages.length - 1]?.createdAt ?? "";
    return bLast.localeCompare(aLast);
  });

  return convs;
}

export async function countUnreadMessages(db: Database, userId: string) {
  const result = await db
    .select({ count: countDistinct(schema.directMessages.id) })
    .from(schema.directMessages)
    .innerJoin(
      schema.directMessageConversations,
      eq(schema.directMessages.conversationId, schema.directMessageConversations.id),
    )
    .where(
      and(
        ne(schema.directMessages.senderId, userId),
        eq(schema.directMessages.isRead, 0),
        or(
          eq(schema.directMessageConversations.initiatorId, userId),
          eq(schema.directMessageConversations.memberId, userId),
        ),
      ),
    );
  return result[0]?.count ?? 0;
}

export async function findDmByPk(db: Database, id: string) {
  return db.query.directMessages.findFirst({
    where: eq(schema.directMessages.id, id),
    with: dmSenderWith,
  });
}
