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

  // Step 1: Get post IDs matching text criteria (fast, no JOINs)
  const textPostIds = await Post.unscoped().findAll({
    attributes: ["id", "createdAt"],
    where: { ...textWhere, ...dateWhere },
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  // Step 2: Get post IDs matching user criteria
  let userPostIds: { id: string; createdAt: Date }[] = [];
  if (searchTerm) {
    const matchedUsers = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const matchedUserIds = matchedUsers.map((u) => u.id);
    if (matchedUserIds.length > 0) {
      userPostIds = await Post.unscoped().findAll({
        attributes: ["id", "createdAt"],
        where: { ...dateWhere, userId: { [Op.in]: matchedUserIds } },
        order: [["createdAt", "DESC"]],
        raw: true,
      });
    }
  }

  // Merge, deduplicate, and sort by createdAt DESC
  const seenIds = new Set<string>();
  const allPosts: { id: string; createdAt: Date }[] = [];
  for (const p of [...textPostIds, ...userPostIds]) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      allPosts.push(p);
    }
  }
  allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination
  const sliced = allPosts.slice(offset ?? 0, (offset ?? 0) + (limit ?? allPosts.length));

  if (sliced.length === 0) {
    return c.json([] as PostResponse[]);
  }

  // Step 3: Load full details for paginated IDs only
  const posts = await Post.scope("detail").findAll({
    where: { id: { [Op.in]: sliced.map((p) => p.id) } },
  });

  // Restore sort order
  const postsMap = new Map(posts.map((p) => [p.id, p]));
  const sorted = sliced.map((s) => postsMap.get(s.id)!).filter(Boolean);

  return c.json(sorted.map((p) => p.toJSON()) as unknown as PostResponse[]);
});
