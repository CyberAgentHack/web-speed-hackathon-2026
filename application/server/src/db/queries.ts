import { asc, desc, eq, or, type SQL } from "drizzle-orm";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";

import { comments, directMessageConversations, posts } from "./schema";
import { serializeDirectMessage } from "./serializers";

import { getDb, getSqlite } from "./index";

// --- Prepared statement cache (invalidated on DB swap) ---
// biome-ignore lint: bun:sqlite types
let _preparedDb: any = null;
// biome-ignore lint: bun:sqlite Statement type
let _stmtCountUnread: any = null;
// biome-ignore lint: bun:sqlite Statement type
let _stmtUnreadConvIds: any = null;

function ensurePrepared() {
  const sqlite = getSqlite();
  if (_preparedDb === sqlite) return;
  _preparedDb = sqlite;

  _stmtCountUnread = sqlite.prepare(`
    SELECT COUNT(*) as count
    FROM DirectMessages dm
    INNER JOIN DirectMessageConversations c ON dm.conversationId = c.id
    WHERE dm.senderId != ?1
      AND dm.isRead = 0
      AND (c.initiatorId = ?1 OR c.memberId = ?1)
  `);

  _stmtUnreadConvIds = sqlite.prepare(`
    SELECT DISTINCT dm.conversationId
    FROM DirectMessages dm
    INNER JOIN DirectMessageConversations c ON dm.conversationId = c.id
    WHERE dm.senderId != ?1
      AND dm.isRead = 0
      AND (c.initiatorId = ?1 OR c.memberId = ?1)
  `);
}

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

// biome-ignore lint: bun:sqlite Statement type
let _stmtConvList: any = null;

interface ConvListRow {
  id: string;
  initiatorId: string;
  memberId: string;
  createdAt: string;
  updatedAt: string;
  iu_id: string;
  iu_username: string;
  iu_name: string;
  iu_description: string;
  iu_password: string;
  iu_profileImageId: string;
  iu_createdAt: string;
  iu_updatedAt: string;
  ip_id: string | null;
  ip_alt: string | null;
  ip_createdAt: string | null;
  ip_updatedAt: string | null;
  mu_id: string;
  mu_username: string;
  mu_name: string;
  mu_description: string;
  mu_password: string;
  mu_profileImageId: string;
  mu_createdAt: string;
  mu_updatedAt: string;
  mp_id: string | null;
  mp_alt: string | null;
  mp_createdAt: string | null;
  mp_updatedAt: string | null;
  dm_id: string | null;
  dm_body: string | null;
  dm_isRead: number | null;
  dm_createdAt: string | null;
  dm_updatedAt: string | null;
  dm_senderId: string | null;
  dm_conversationId: string | null;
  su_id: string | null;
  su_username: string | null;
  su_name: string | null;
  su_description: string | null;
  su_password: string | null;
  su_profileImageId: string | null;
  su_createdAt: string | null;
  su_updatedAt: string | null;
  sp_id: string | null;
  sp_alt: string | null;
  sp_createdAt: string | null;
  sp_updatedAt: string | null;
}

function assembleConvListRow(r: ConvListRow) {
  const initiator = {
    id: r.iu_id,
    username: r.iu_username,
    name: r.iu_name,
    description: r.iu_description,
    password: r.iu_password,
    profileImageId: r.iu_profileImageId,
    createdAt: r.iu_createdAt,
    updatedAt: r.iu_updatedAt,
    profileImage: r.ip_id
      ? { id: r.ip_id, alt: r.ip_alt!, createdAt: r.ip_createdAt!, updatedAt: r.ip_updatedAt! }
      : null,
  };
  const member = {
    id: r.mu_id,
    username: r.mu_username,
    name: r.mu_name,
    description: r.mu_description,
    password: r.mu_password,
    profileImageId: r.mu_profileImageId,
    createdAt: r.mu_createdAt,
    updatedAt: r.mu_updatedAt,
    profileImage: r.mp_id
      ? { id: r.mp_id, alt: r.mp_alt!, createdAt: r.mp_createdAt!, updatedAt: r.mp_updatedAt! }
      : null,
  };
  const messages = r.dm_id
    ? [
        {
          id: r.dm_id,
          body: r.dm_body!,
          isRead: Boolean(r.dm_isRead),
          createdAt: r.dm_createdAt!,
          updatedAt: r.dm_updatedAt!,
          senderId: r.dm_senderId!,
          conversationId: r.dm_conversationId!,
          sender: {
            id: r.su_id!,
            username: r.su_username!,
            name: r.su_name!,
            description: r.su_description!,
            password: r.su_password!,
            profileImageId: r.su_profileImageId!,
            createdAt: r.su_createdAt!,
            updatedAt: r.su_updatedAt!,
            profileImage: r.sp_id
              ? {
                  id: r.sp_id,
                  alt: r.sp_alt!,
                  createdAt: r.sp_createdAt!,
                  updatedAt: r.sp_updatedAt!,
                }
              : null,
          },
        },
      ]
    : [];
  return {
    id: r.id,
    initiatorId: r.initiatorId,
    memberId: r.memberId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    initiator,
    member,
    messages,
  };
}

export function findConversationsForList(userId: string) {
  const sqlite = getSqlite();
  if (_preparedDb !== sqlite || !_stmtConvList) {
    _stmtConvList = sqlite.prepare(`
      SELECT
        c.id, c.initiatorId, c.memberId, c.createdAt, c.updatedAt,
        iu.id as iu_id, iu.username as iu_username, iu.name as iu_name, iu.description as iu_description, iu.password as iu_password, iu.profileImageId as iu_profileImageId, iu.createdAt as iu_createdAt, iu.updatedAt as iu_updatedAt,
        ip.id as ip_id, ip.alt as ip_alt, ip.createdAt as ip_createdAt, ip.updatedAt as ip_updatedAt,
        mu.id as mu_id, mu.username as mu_username, mu.name as mu_name, mu.description as mu_description, mu.password as mu_password, mu.profileImageId as mu_profileImageId, mu.createdAt as mu_createdAt, mu.updatedAt as mu_updatedAt,
        mp.id as mp_id, mp.alt as mp_alt, mp.createdAt as mp_createdAt, mp.updatedAt as mp_updatedAt,
        dm.id as dm_id, dm.body as dm_body, dm.isRead as dm_isRead, dm.createdAt as dm_createdAt, dm.updatedAt as dm_updatedAt, dm.senderId as dm_senderId, dm.conversationId as dm_conversationId,
        su.id as su_id, su.username as su_username, su.name as su_name, su.description as su_description, su.password as su_password, su.profileImageId as su_profileImageId, su.createdAt as su_createdAt, su.updatedAt as su_updatedAt,
        sp.id as sp_id, sp.alt as sp_alt, sp.createdAt as sp_createdAt, sp.updatedAt as sp_updatedAt
      FROM DirectMessageConversations c
      JOIN Users iu ON c.initiatorId = iu.id
      LEFT JOIN ProfileImages ip ON iu.profileImageId = ip.id
      JOIN Users mu ON c.memberId = mu.id
      LEFT JOIN ProfileImages mp ON mu.profileImageId = mp.id
      LEFT JOIN DirectMessages dm ON dm.conversationId = c.id
        AND dm.rowid = (
          SELECT dm2.rowid FROM DirectMessages dm2
          WHERE dm2.conversationId = c.id
          ORDER BY dm2.createdAt DESC
          LIMIT 1
        )
      LEFT JOIN Users su ON dm.senderId = su.id
      LEFT JOIN ProfileImages sp ON su.profileImageId = sp.id
      WHERE c.initiatorId = ?1 OR c.memberId = ?1
    `);
  }
  const rows = _stmtConvList.all(userId) as ConvListRow[];
  return rows.map(assembleConvListRow);
}

export function getUnreadConversationIds(userId: string): Set<string> {
  ensurePrepared();
  const rows = _stmtUnreadConvIds.all(userId) as { conversationId: string }[];
  return new Set(rows.map((r) => r.conversationId));
}

export async function findConversationWithRelations(where: SQL) {
  const db = getDb();
  return await db.query.directMessageConversations.findFirst({
    where,
    with: conversationFullWith(),
  });
}

export function countUnreadMessages(receiverId: string): number {
  ensurePrepared();
  const result = _stmtCountUnread.get(receiverId) as { count: number } | null;
  return result?.count ?? 0;
}

// biome-ignore lint: bun:sqlite Statement type
let _stmtDmNotification: any = null;

interface DmNotifRow {
  dm_id: string;
  dm_body: string;
  dm_isRead: number;
  dm_createdAt: string;
  dm_updatedAt: string;
  dm_senderId: string;
  dm_conversationId: string;
  su_id: string;
  su_username: string;
  su_name: string;
  su_description: string;
  su_password: string;
  su_profileImageId: string;
  su_createdAt: string;
  su_updatedAt: string;
  sp_id: string | null;
  sp_alt: string | null;
  sp_createdAt: string | null;
  sp_updatedAt: string | null;
  c_initiatorId: string;
  c_memberId: string;
}

export function emitDmNotifications(messageId: string) {
  const sqlite = getSqlite();
  if (_preparedDb !== sqlite || !_stmtDmNotification) {
    _stmtDmNotification = sqlite.prepare(`
      SELECT
        dm.id as dm_id, dm.body as dm_body, dm.isRead as dm_isRead, dm.createdAt as dm_createdAt, dm.updatedAt as dm_updatedAt, dm.senderId as dm_senderId, dm.conversationId as dm_conversationId,
        su.id as su_id, su.username as su_username, su.name as su_name, su.description as su_description, su.password as su_password, su.profileImageId as su_profileImageId, su.createdAt as su_createdAt, su.updatedAt as su_updatedAt,
        sp.id as sp_id, sp.alt as sp_alt, sp.createdAt as sp_createdAt, sp.updatedAt as sp_updatedAt,
        c.initiatorId as c_initiatorId, c.memberId as c_memberId
      FROM DirectMessages dm
      JOIN Users su ON dm.senderId = su.id
      LEFT JOIN ProfileImages sp ON su.profileImageId = sp.id
      JOIN DirectMessageConversations c ON dm.conversationId = c.id
      WHERE dm.id = ?1
    `);
  }

  const r = _stmtDmNotification.get(messageId) as DmNotifRow | null;
  if (!r) return;

  const receiverId = r.c_initiatorId === r.dm_senderId ? r.c_memberId : r.c_initiatorId;
  const unreadCount = countUnreadMessages(receiverId);

  const serialized = serializeDirectMessage({
    id: r.dm_id,
    body: r.dm_body,
    isRead: Boolean(r.dm_isRead),
    createdAt: r.dm_createdAt,
    updatedAt: r.dm_updatedAt,
    senderId: r.dm_senderId,
    conversationId: r.dm_conversationId,
    sender: {
      id: r.su_id,
      username: r.su_username,
      name: r.su_name,
      description: r.su_description,
      password: r.su_password,
      profileImageId: r.su_profileImageId,
      createdAt: r.su_createdAt,
      updatedAt: r.su_updatedAt,
      profileImage: r.sp_id
        ? { id: r.sp_id, alt: r.sp_alt!, createdAt: r.sp_createdAt!, updatedAt: r.sp_updatedAt! }
        : null,
    },
  });

  eventhub.emit(`dm:conversation/${r.dm_conversationId}:message`, serialized);
  eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
}

// biome-ignore lint: bun:sqlite Statement type
let _stmtUserSearch: any = null;

export function findUsersBySearch(searchTerm: string) {
  const sqlite = getSqlite();
  if (_preparedDb !== sqlite || !_stmtUserSearch) {
    _stmtUserSearch = sqlite.prepare(`
      SELECT id FROM Users WHERE username LIKE ?1 OR name LIKE ?1
    `);
  }
  return _stmtUserSearch.all(searchTerm) as { id: string }[];
}
