import { and, eq, gte, inArray, like, lte, type SQL } from "drizzle-orm";

import {
  findComments,
  findPostDetail,
  findPostsDetail,
  findUserWithProfile,
  findUsersBySearch,
} from "@web-speed-hackathon-2026/server/src/db/queries";
import { posts, users } from "@web-speed-hackathon-2026/server/src/db/schema";
import {
  serializeComment,
  serializePostDetail,
  serializeUser,
} from "@web-speed-hackathon-2026/server/src/db/serializers";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export interface SSRData {
  activeUser?: ReturnType<typeof serializeUser> | null;
  posts?: ReturnType<typeof serializePostDetail>[];
  post?: ReturnType<typeof serializePostDetail> | null;
  comments?: ReturnType<typeof serializeComment>[];
  user?: ReturnType<typeof serializeUser> | null;
  userPosts?: ReturnType<typeof serializePostDetail>[];
}

interface SSRRouteMatch {
  route: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

function matchRoute(url: string): SSRRouteMatch | null {
  const [pathname, search] = url.split("?");
  const query: Record<string, string> = {};
  if (search) {
    for (const [k, v] of new URLSearchParams(search)) {
      query[k] = v;
    }
  }

  if (pathname === "/") {
    return { route: "timeline", params: {}, query };
  }

  const postMatch = pathname!.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    return { route: "post", params: { postId: postMatch[1]! }, query };
  }

  const userPostsMatch = pathname!.match(/^\/users\/([^/]+)$/);
  if (userPostsMatch) {
    return { route: "userProfile", params: { username: userPostsMatch[1]! }, query };
  }

  if (pathname === "/search") {
    return { route: "search", params: {}, query };
  }

  if (pathname === "/terms") {
    return { route: "terms", params: {}, query };
  }

  return null;
}

export async function getServerData(url: string, sessionUserId?: string): Promise<SSRData | null> {
  const match = matchRoute(url);
  if (!match) return null;

  let activeUser: SSRData["activeUser"] = null;
  if (sessionUserId) {
    const userModel = await findUserWithProfile(eq(users.id, sessionUserId));
    activeUser = userModel ? serializeUser(userModel) : null;
  }

  switch (match.route) {
    case "timeline": {
      const rawPosts = await findPostsDetail({ limit: 30, offset: 0 });
      return { activeUser, posts: rawPosts.map(serializePostDetail) };
    }

    case "post": {
      const rawPost = await findPostDetail(match.params["postId"]!);
      if (!rawPost) {
        return { activeUser, post: null, comments: [] };
      }
      const rawComments = await findComments(match.params["postId"]!, {
        limit: 30,
        offset: 0,
      });
      return {
        activeUser,
        post: serializePostDetail(rawPost),
        comments: rawComments.map(serializeComment),
      };
    }

    case "userProfile": {
      const userModel = await findUserWithProfile(eq(users.username, match.params["username"]!));
      if (!userModel) {
        return { activeUser, user: null, userPosts: [] };
      }
      const rawPosts = await findPostsDetail({
        where: eq(posts.userId, userModel.id),
        limit: 30,
        offset: 0,
      });
      return {
        activeUser,
        user: serializeUser(userModel),
        userPosts: rawPosts.map(serializePostDetail),
      };
    }

    case "search": {
      const q = match.query["q"];
      if (!q || q.trim() === "") {
        return { activeUser, posts: [] };
      }

      const { keywords, sinceDate, untilDate } = parseSearchQuery(q);
      if (!keywords && !sinceDate && !untilDate) {
        return { activeUser, posts: [] };
      }

      const searchTerm = keywords ? `%${keywords}%` : null;
      const dateConditions: SQL[] = [];
      if (sinceDate) dateConditions.push(gte(posts.createdAt, sinceDate.toISOString()));
      if (untilDate) dateConditions.push(lte(posts.createdAt, untilDate.toISOString()));

      const textConditions: SQL[] = [...dateConditions];
      if (searchTerm) textConditions.push(like(posts.text, searchTerm));

      const textQuery: Parameters<typeof findPostsDetail>[0] = { limit: 30, offset: 0 };
      if (textConditions.length > 0) textQuery.where = and(...textConditions)!;
      const postsByText = await findPostsDetail(textQuery);

      let postsByUser: typeof postsByText = [];
      if (searchTerm) {
        const matchedUsers = findUsersBySearch(searchTerm);
        const matchedUserIds = matchedUsers.map((u) => u.id);
        if (matchedUserIds.length > 0) {
          postsByUser = await findPostsDetail({
            limit: 30,
            offset: 0,
            where: and(inArray(posts.userId, matchedUserIds), ...dateConditions)!,
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
      const result = mergedPosts.slice(0, 30);

      return { activeUser, posts: result.map(serializePostDetail) };
    }

    case "terms": {
      return { activeUser };
    }

    default:
      return null;
  }
}
