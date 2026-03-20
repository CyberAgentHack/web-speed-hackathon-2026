import { and, gte, inArray, like, lte, type SQL } from "drizzle-orm";
import { Hono } from "hono";

import {
  findPostsDetail,
  findUsersBySearch,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import { posts } from "@web-speed-hackathon-2026/server/src/db/schema";
import { serializePostDetail } from "@web-speed-hackathon-2026/server/src/db/serializers";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import type { PostResponse } from "@web-speed-hackathon-2026/server/src/types/api";
import { parsePagination } from "@web-speed-hackathon-2026/server/src/utils/parse_pagination";
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
  const { limit, offset } = parsePagination(c.req.query());

  const dateConditions: SQL[] = [];
  if (sinceDate) {
    dateConditions.push(gte(posts.createdAt, sinceDate.toISOString()));
  }
  if (untilDate) {
    dateConditions.push(lte(posts.createdAt, untilDate.toISOString()));
  }

  const textConditions: SQL[] = [...dateConditions];
  if (searchTerm) {
    textConditions.push(like(posts.text, searchTerm));
  }

  const textQuery: Parameters<typeof findPostsDetail>[0] = {
    ...(limit != null ? { limit } : {}),
    ...(offset != null ? { offset } : {}),
  };
  if (textConditions.length > 0) textQuery.where = and(...textConditions)!;
  const postsByText = await findPostsDetail(textQuery);

  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    const matchedUsers = findUsersBySearch(searchTerm);
    const matchedUserIds = matchedUsers.map((u) => u.id);
    if (matchedUserIds.length > 0) {
      const userConditions: SQL[] = [inArray(posts.userId, matchedUserIds), ...dateConditions];
      postsByUser = await findPostsDetail({
        where: and(...userConditions)!,
        ...(limit != null ? { limit } : {}),
        ...(offset != null ? { offset } : {}),
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

  mergedPosts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const result = mergedPosts.slice(0, limit ?? mergedPosts.length);

  return c.json(result.map(serializePostDetail) as unknown as PostResponse[]);
});
