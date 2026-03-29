import { Router } from "express";
import { and, eq, gte, like, lte, or } from "drizzle-orm";

import { getDb } from "@web-speed-hackathon-2026/server/src/db/client";
import * as schema from "@web-speed-hackathon-2026/server/src/db/schema";
import { findPosts } from "@web-speed-hackathon-2026/server/src/db/queries";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/sentiment_analyzer";

export const searchRouter = Router();

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ posts: [], isNegative: false });
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send({ posts: [], isNegative: false });
  }

  const db = getDb();
  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  // Build date conditions
  const dateConditions: any[] = [];
  if (sinceDate) {
    dateConditions.push(gte(schema.posts.createdAt, sinceDate.toISOString()));
  }
  if (untilDate) {
    dateConditions.push(lte(schema.posts.createdAt, untilDate.toISOString()));
  }
  const dateWhere = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  // Text search
  const textWhere = searchTerm
    ? and(like(schema.posts.text, searchTerm), dateWhere)
    : dateWhere;

  const postsByText = await findPosts(db, { limit, offset, where: textWhere });

  // User name/username search
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    // Find user IDs matching the search term
    const matchingUsers = await db.query.users.findMany({
      where: or(
        like(schema.users.username, searchTerm),
        like(schema.users.name, searchTerm),
      ),
      columns: { id: true as const },
    });

    if (matchingUsers.length > 0) {
      const userIds = matchingUsers.map((u) => u.id);
      // Fetch posts for each matching user
      for (const userId of userIds) {
        const userPosts = await findPosts(db, {
          where: and(eq(schema.posts.userId, userId), dateWhere),
          limit,
        });
        postsByUser.push(...userPosts);
      }
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

  const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));

  const isNegative = keywords ? (await analyzeSentiment(keywords)).label === "negative" : false;

  return res.status(200).type("application/json").send({ posts: result, isNegative });
});
