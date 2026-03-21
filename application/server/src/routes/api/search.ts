import { Hono } from "hono";
import type { Context } from "hono";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = new Hono();

function parseLimit(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.min(parsed, 100);
}

function parseOffset(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

searchRouter.get("/search", async (c: Context) => {
  const query = c.req.query("q");

  if (typeof query !== "string" || query.trim() === "") {
    return c.json([], 200);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return c.json([], 200);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = parseLimit(c.req.query("limit")) ?? 30;
  const offset = parseOffset(c.req.query("offset"));
  const mergedOffset = offset ?? 0;
  const fetchSize = Math.min(limit + mergedOffset, 100);

  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    limit: fetchSize,
    offset: 0,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    const matchedUsers = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const matchedUserIds = matchedUsers.map((user) => user.id);

    if (matchedUserIds.length > 0) {
      postsByUser = await Post.findAll({
        limit: fetchSize,
        offset: 0,
        where: {
          ...dateWhere,
          userId: { [Op.in]: matchedUserIds },
        },
      });
    }
  }

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = mergedPosts.slice(mergedOffset, mergedOffset + limit);

  return c.json(result, 200);
});
