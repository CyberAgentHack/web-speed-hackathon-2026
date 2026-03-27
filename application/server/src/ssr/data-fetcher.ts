import { Op, QueryTypes } from "sequelize";

import {
  Comment,
  DirectMessage,
  DirectMessageConversation,
  Post,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

const INITIAL_LIMIT = 30;
const DM_LIMIT = 20;
const DM_LIST_LIMIT = 15;

interface SSRData {
  routeData: Record<string, unknown>;
  activeUser: unknown | null;
}

export async function fetchSSRData(
  pathname: string,
  sessionUserId: string | undefined,
): Promise<SSRData> {
  const routeData: Record<string, unknown> = {};

  // Fetch active user if session exists
  let activeUser: unknown | null = null;
  if (sessionUserId) {
    try {
      const user = await User.scope("withProfileImage").findByPk(sessionUserId);
      if (user) {
        activeUser = user.toJSON();
      }
    } catch {
      // Ignore errors fetching active user
    }
  }

  try {
    // Timeline page: /
    if (pathname === "/") {
      const posts = await Post.scope("withRelations").findAll({
        limit: INITIAL_LIMIT,
      });
      routeData["/api/v1/posts"] = posts.map((p) => p.toJSON());
    }

    // Post detail page: /posts/:postId
    const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
    if (postMatch) {
      const postId = postMatch[1]!;
      const [post, comments] = await Promise.all([
        Post.scope("withRelations").findByPk(postId),
        Comment.scope("withUser").findAll({
          where: { postId },
          limit: 10,
        }),
      ]);
      if (post) {
        routeData[`/api/v1/posts/${postId}`] = post.toJSON();
        routeData[`/api/v1/posts/${postId}/comments`] = comments.map((c) => c.toJSON());
      }
    }

    // DM list page: /dm
    if (pathname === "/dm" && sessionUserId) {
      const conversations = await DirectMessageConversation.scope("withParticipants").findAll({
        where: {
          [Op.or]: [{ initiatorId: sessionUserId }, { memberId: sessionUserId }],
        },
      });

      if (conversations.length > 0) {
        const conversationIds = conversations.map((c) => c.id);
        const sequelize = DirectMessage.sequelize!;

        const latestMessageRows = await sequelize.query<{ id: string; conversationId: string }>(
          `SELECT id, conversationId FROM (
             SELECT id, conversationId, ROW_NUMBER() OVER (PARTITION BY conversationId ORDER BY createdAt DESC) as rn
             FROM DirectMessages
             WHERE conversationId IN (:conversationIds)
           ) sub WHERE rn = 1`,
          { replacements: { conversationIds }, type: QueryTypes.SELECT },
        );

        if (latestMessageRows.length > 0) {
          const latestMessages = await DirectMessage.scope("withSender").findAll({
            where: { id: { [Op.in]: latestMessageRows.map((r) => r.id) } },
          });

          const unreadRows = await sequelize.query<{ conversationId: string; unreadCount: number }>(
            `SELECT conversationId, COUNT(*) as unreadCount FROM DirectMessages
             WHERE conversationId IN (:conversationIds)
             AND senderId != :userId
             AND isRead = 0
             GROUP BY conversationId`,
            { replacements: { conversationIds, userId: sessionUserId }, type: QueryTypes.SELECT },
          );

          const latestMessageMap = new Map(latestMessages.map((m) => [m.conversationId, m]));
          const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, true]));

          const sorted = conversations
            .filter((c) => latestMessageMap.has(c.id))
            .map((c) => {
              const latestMessage = latestMessageMap.get(c.id)!;
              return {
                ...c.toJSON(),
                messages: [latestMessage],
                hasUnread: unreadMap.get(c.id) ?? false,
              };
            })
            .sort((a, b) => {
              const aTime = new Date(a.messages[0]!.createdAt).getTime();
              const bTime = new Date(b.messages[0]!.createdAt).getTime();
              return bTime - aTime;
            });

          routeData["/api/v1/dm"] = sorted.slice(0, DM_LIST_LIMIT);
        } else {
          routeData["/api/v1/dm"] = [];
        }
      } else {
        routeData["/api/v1/dm"] = [];
      }
    }

    // DM detail page: /dm/:conversationId
    const dmMatch = pathname.match(/^\/dm\/([^/]+)$/);
    if (dmMatch && sessionUserId) {
      const conversationId = dmMatch[1]!;
      const conversation = await DirectMessageConversation.scope("withParticipants").findOne({
        where: {
          id: conversationId,
          [Op.or]: [{ initiatorId: sessionUserId }, { memberId: sessionUserId }],
        },
      });
      if (conversation) {
        routeData[`/api/v1/dm/${conversationId}`] = conversation.toJSON();

        const rows = await DirectMessage.scope("withSender").findAll({
          where: { conversationId: conversation.id },
          order: [["createdAt", "DESC"]],
          limit: DM_LIMIT + 1,
        });
        const hasMore = rows.length > DM_LIMIT;
        const messages = rows.slice(0, DM_LIMIT).reverse().map((m) => m.toJSON());
        routeData[`/api/v1/dm/${conversationId}/messages`] = { messages, hasMore };
      }
    }

    // User profile page: /users/:username
    const userMatch = pathname.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      const username = decodeURIComponent(userMatch[1]!);
      const user = await User.scope("withProfileImage").findOne({
        where: { username },
      });
      if (user) {
        routeData[`/api/v1/users/${username}`] = user.toJSON();
        const posts = await Post.scope("withRelations").findAll({
          where: { userId: user.get("id") as string },
          limit: INITIAL_LIMIT,
        });
        routeData[`/api/v1/users/${username}/posts`] = posts.map((p) => p.toJSON());
      }
    }
  } catch (err) {
    console.error("SSR data fetch error:", err);
  }

  return { routeData, activeUser };
}
