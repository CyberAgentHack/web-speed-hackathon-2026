import type { Request } from "express";
import { Op, QueryTypes, col, where } from "sequelize";

import {
  Comment,
  DirectMessage,
  DirectMessageConversation,
  Post,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export interface LoaderContext {
  getMe: () => Promise<unknown>;
  getPosts: (limit: number, offset: number) => Promise<unknown[]>;
  getPost: (postId: string) => Promise<unknown>;
  getComments: (postId: string, limit: number, offset: number) => Promise<unknown[]>;
  getUser: (username: string) => Promise<unknown>;
  getUserPosts: (username: string, limit: number, offset: number) => Promise<unknown[]>;
  searchPosts: (query: string, limit: number, offset: number) => Promise<unknown[]>;
  getDmConversations: () => Promise<unknown[] | null>;
  getDmConversation: (conversationId: string) => Promise<unknown>;
}

export function createLoaderContext(req: Request): LoaderContext {
  const userId = req.session?.userId as string | undefined;

  return {
    async getMe() {
      if (!userId) return null;
      const user = await User.findByPk(userId);
      return user ? user.toJSON() : null;
    },

    async getPosts(limit: number, offset: number) {
      const posts = await Post.findAll({ limit, offset });
      return posts.map((p) => p.toJSON());
    },

    async getPost(postId: string) {
      const post = await Post.findByPk(postId);
      return post ? post.toJSON() : null;
    },

    async getComments(postId: string, limit: number, offset: number) {
      const comments = await Comment.findAll({
        limit,
        offset,
        where: { postId },
      });
      return comments.map((c) => c.toJSON());
    },

    async getUser(username: string) {
      const user = await User.findOne({ where: { username } });
      return user ? user.toJSON() : null;
    },

    async getUserPosts(username: string, limit: number, offset: number) {
      const user = await User.findOne({ where: { username } });
      if (!user) return [];
      const posts = await Post.findAll({
        limit,
        offset,
        where: { userId: user.id },
      });
      return posts.map((p) => p.toJSON());
    },

    async searchPosts(query: string, limit: number, offset: number) {
      if (!query.trim()) return [];
      const { keywords, sinceDate, untilDate } = parseSearchQuery(query);
      if (!keywords && !sinceDate && !untilDate) return [];

      const searchTerm = keywords ? `%${keywords}%` : null;
      const dateConditions: Record<symbol, Date>[] = [];
      if (sinceDate) dateConditions.push({ [Op.gte]: sinceDate });
      if (untilDate) dateConditions.push({ [Op.lte]: untilDate });
      const dateWhere =
        dateConditions.length > 0
          ? { createdAt: Object.assign({}, ...dateConditions) }
          : {};

      const whereClause: Record<string | symbol, unknown> = { ...dateWhere };
      if (searchTerm) {
        whereClause[Op.or] = [
          { text: { [Op.like]: searchTerm } },
          { "$user.username$": { [Op.like]: searchTerm } },
          { "$user.name$": { [Op.like]: searchTerm } },
        ];
      }

      const matchedRows = await Post.unscoped().findAll({
        attributes: ["id"],
        include: [{ model: User.unscoped(), as: "user", attributes: [] }],
        where: whereClause,
        limit,
        offset,
        order: [["id", "DESC"]],
        subQuery: false,
        raw: true,
      });

      if (matchedRows.length === 0) return [];
      const posts = await Post.findAll({
        where: { id: matchedRows.map((r: { id: string }) => r.id) },
      });
      return posts.map((p) => p.toJSON());
    },

    async getDmConversations() {
      if (!userId) return null;
      try {
        const sequelize = DirectMessageConversation.sequelize!;
        const msgTable = DirectMessage.getTableName() as string;

        const conversations = await DirectMessageConversation.findAll({
          where: {
            [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
          },
        });
        if (conversations.length === 0) return [];
        const convIds = conversations.map((c) => c.id);

        const lastMsgRows = await sequelize.query<{ id: string; conversationId: string }>(
          `SELECT dm.id, dm.conversationId FROM "${msgTable}" dm
           INNER JOIN (
             SELECT conversationId, MAX(createdAt) as maxCreated
             FROM "${msgTable}" WHERE conversationId IN (:convIds)
             GROUP BY conversationId
           ) latest ON dm.conversationId = latest.conversationId AND dm.createdAt = latest.maxCreated`,
          { replacements: { convIds }, type: QueryTypes.SELECT },
        );

        const lastMessages = await DirectMessage.findAll({
          where: { id: lastMsgRows.map((r) => r.id) },
        });

        const unreadRows = await sequelize.query<{ conversationId: string }>(
          `SELECT DISTINCT conversationId FROM "${msgTable}"
           WHERE conversationId IN (:convIds) AND senderId != :userId AND isRead = 0`,
          { replacements: { convIds, userId }, type: QueryTypes.SELECT },
        );
        const unreadSet = new Set(unreadRows.map((r) => r.conversationId));

        const msgByConv = new Map<string, object>();
        for (const msg of lastMessages) {
          msgByConv.set(msg.conversationId, msg.toJSON());
        }

        return conversations
          .filter((c) => msgByConv.has(c.id))
          .sort((a, b) => {
            const msgA = msgByConv.get(a.id) as { createdAt: string };
            const msgB = msgByConv.get(b.id) as { createdAt: string };
            return new Date(msgB.createdAt).getTime() - new Date(msgA.createdAt).getTime();
          })
          .map((c) => ({
            ...c.toJSON(),
            messages: [msgByConv.get(c.id)!],
            hasUnread: unreadSet.has(c.id),
          }));
      } catch {
        return null;
      }
    },

    async getDmConversation(conversationId: string) {
      if (!userId) return null;
      const conversation = await DirectMessageConversation.scope("withMessages").findOne({
        where: {
          id: conversationId,
          [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
        },
      });
      return conversation ? conversation.toJSON() : null;
    },
  };
}
