import { Hono } from "hono";
import type { Context } from "hono";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { Op } from "sequelize";

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
  const limit = parseLimit(c.req.query("limit"));
  const offset = parseOffset(c.req.query("offset"));

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
    limit,
    offset,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      include: [
        {
          association: "user",
          attributes: { exclude: ["profileImageId"] },
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      limit,
      offset,
      where: dateWhere,
    });
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

  const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));

  return c.json(result, 200);
});
