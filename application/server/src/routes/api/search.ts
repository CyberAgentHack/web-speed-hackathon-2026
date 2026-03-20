import { Hono } from "hono";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { PostResponse } from "@web-speed-hackathon-2026/server/src/types/api";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = new Hono<SessionEnv>().get("/search", async (c) => {
  const query = c.req.query("q");

  if (typeof query !== "string" || query.trim() === "") {
    return c.json([] as PostResponse[]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return c.json([] as PostResponse[]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");
  const limitOffset = {
    ...(limitParam != null ? { limit: Number(limitParam) } : {}),
    ...(offsetParam != null ? { offset: Number(offsetParam) } : {}),
  };

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

  const limit = limitParam != null ? Number(limitParam) : undefined;
  const offset = offsetParam != null ? Number(offsetParam) : undefined;

  const postsByText = await Post.scope("detail").findAll({
    ...limitOffset,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    // User defaultScope の exclude: ["profileImageId"] と include: profileImage が
    // 競合するため、unscoped() で userId だけ取得し、scope("detail") で投稿を取得
    const matchedUsers = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const matchedUserIds = matchedUsers.map((u) => u.id);
    if (matchedUserIds.length > 0) {
      postsByUser = await Post.scope("detail").findAll({
        ...limitOffset,
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

  const result = mergedPosts.slice(offset ?? 0, (offset ?? 0) + (limit ?? mergedPosts.length));

  return c.json(result.map((p) => p.toJSON()) as unknown as PostResponse[]);
});
