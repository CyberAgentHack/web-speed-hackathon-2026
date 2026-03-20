import { and, asc, count, desc, eq, like, ne, or, type SQL } from "drizzle-orm";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";

import { comments, directMessageConversations, directMessages, posts, users } from "./schema";
import { serializeDirectMessage } from "./serializers";

import { getDb } from "./index";

const userWithProfileImage = {
  with: { profileImage: true },
} as const;

const postDetailWith = {
  user: userWithProfileImage,
  postsImages: {
    with: { image: true },
  },
  movie: true,
  sound: true,
} as const;

export async function findPostsDetail(opts: { where?: SQL; limit?: number; offset?: number }) {
  const db = getDb();
  return await db.query.posts.findMany({
    ...opts,
    orderBy: [desc(posts.id)],
    with: postDetailWith,
  });
}

export async function findPostDetail(postId: string) {
  const db = getDb();
  return await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: postDetailWith,
  });
}

export async function findUserWithProfile(where: SQL) {
  const db = getDb();
  return await db.query.users.findFirst({
    where,
    with: { profileImage: true },
  });
}

export async function findComments(postId: string, opts: { limit?: number; offset?: number }) {
  const db = getDb();
  return await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    orderBy: [asc(comments.createdAt)],
    ...opts,
    with: {
      user: userWithProfileImage,
    },
  });
}

function conversationFullWith() {
  return {
    initiator: userWithProfileImage,
    member: userWithProfileImage,
    messages: {
      with: {
        sender: userWithProfileImage,
      },
      orderBy: (fields: any, { asc: ascFn }: any) => [ascFn(fields.createdAt)],
    },
  };
}

export async function findConversations(userId: string) {
  const db = getDb();
  return await db.query.directMessageConversations.findMany({
    where: or(
      eq(directMessageConversations.initiatorId, userId),
      eq(directMessageConversations.memberId, userId),
    ),
    with: conversationFullWith(),
  });
}

export async function findConversationWithRelations(where: SQL) {
  const db = getDb();
  return await db.query.directMessageConversations.findFirst({
    where,
    with: conversationFullWith(),
  });
}

export function countUnreadMessages(receiverId: string): number {
  const db = getDb();
  const result = db
    .select({ count: count() })
    .from(directMessages)
    .innerJoin(
      directMessageConversations,
      eq(directMessages.conversationId, directMessageConversations.id),
    )
    .where(
      and(
        ne(directMessages.senderId, receiverId),
        eq(directMessages.isRead, false),
        or(
          eq(directMessageConversations.initiatorId, receiverId),
          eq(directMessageConversations.memberId, receiverId),
        ),
      ),
    )
    .get();
  return result?.count ?? 0;
}

export async function emitDmNotifications(messageId: string) {
  const db = getDb();
  const msg = await db.query.directMessages.findFirst({
    where: eq(directMessages.id, messageId),
    with: {
      sender: userWithProfileImage,
      conversation: true,
    },
  });
  if (!msg?.conversation) return;

  const conversation = msg.conversation;
  const receiverId =
    conversation.initiatorId === msg.senderId ? conversation.memberId : conversation.initiatorId;

  const unreadCount = countUnreadMessages(receiverId);

  eventhub.emit(
    `dm:conversation/${conversation.id}:message`,
    serializeDirectMessage(msg as Parameters<typeof serializeDirectMessage>[0]),
  );
  eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
}

export function findUsersBySearch(searchTerm: string) {
  const db = getDb();
  return db
    .select({ id: users.id })
    .from(users)
    .where(or(like(users.username, searchTerm), like(users.name, searchTerm)))
    .all();
}
