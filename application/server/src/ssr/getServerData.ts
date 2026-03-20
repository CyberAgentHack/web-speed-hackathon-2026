import { Op } from "sequelize";

import { Comment, Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export interface SSRData {
  activeUser?: ReturnType<typeof User.prototype.toJSON> | null;
  posts?: ReturnType<typeof Post.prototype.toJSON>[];
  post?: ReturnType<typeof Post.prototype.toJSON> | null;
  comments?: ReturnType<typeof Comment.prototype.toJSON>[];
  user?: ReturnType<typeof User.prototype.toJSON> | null;
  userPosts?: ReturnType<typeof Post.prototype.toJSON>[];
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

  // SSR 対象ルートのマッチング
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

  // DM, Crok, 404 → SSR スキップ
  return null;
}

export async function getServerData(url: string, sessionUserId?: string): Promise<SSRData | null> {
  const match = matchRoute(url);
  if (!match) return null;

  // activeUser は全 SSR ルート共通
  let activeUser: SSRData["activeUser"] = null;
  if (sessionUserId) {
    const userModel = await User.findByPk(sessionUserId);
    activeUser = userModel ? userModel.toJSON() : null;
  }

  switch (match.route) {
    case "timeline": {
      const postIds = await Post.unscoped().findAll({
        attributes: ["id"],
        order: [["id", "DESC"]],
        limit: 30,
        offset: 0,
        raw: true,
      });
      const posts =
        postIds.length > 0
          ? await Post.scope("detail").findAll({
              where: { id: { [Op.in]: postIds.map((p) => p.id) } },
            })
          : [];
      return { activeUser, posts: posts.map((p) => p.toJSON()) };
    }

    case "post": {
      const post = await Post.scope("detail").findByPk(match.params["postId"]!);
      if (!post) {
        return { activeUser, post: null, comments: [] };
      }
      const comments = await Comment.findAll({
        where: { postId: match.params["postId"]! },
        limit: 30,
        offset: 0,
      });
      return {
        activeUser,
        post: post.toJSON(),
        comments: comments.map((c) => c.toJSON()),
      };
    }

    case "userProfile": {
      const user = await User.findOne({ where: { username: match.params["username"]! } });
      if (!user) {
        return { activeUser, user: null, userPosts: [] };
      }
      const userPostIds = await Post.unscoped().findAll({
        attributes: ["id"],
        where: { userId: user.id },
        order: [["id", "DESC"]],
        limit: 30,
        offset: 0,
        raw: true,
      });
      const userPosts =
        userPostIds.length > 0
          ? await Post.scope("detail").findAll({
              where: { id: { [Op.in]: userPostIds.map((p) => p.id) } },
            })
          : [];
      return {
        activeUser,
        user: user.toJSON(),
        userPosts: userPosts.map((p) => p.toJSON()),
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
      const dateConditions: Record<symbol, Date>[] = [];
      if (sinceDate) dateConditions.push({ [Op.gte]: sinceDate });
      if (untilDate) dateConditions.push({ [Op.lte]: untilDate });
      const dateWhere =
        dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};
      const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

      // Step 1: Get post IDs matching text criteria
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

      // Merge, deduplicate, sort, and slice
      const seenIds = new Set<string>();
      const allPosts: { id: string; createdAt: Date }[] = [];
      for (const p of [...textPostIds, ...userPostIds]) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          allPosts.push(p);
        }
      }
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sliced = allPosts.slice(0, 30);

      if (sliced.length === 0) {
        return { activeUser, posts: [] };
      }

      // Step 3: Load full details
      const posts = await Post.scope("detail").findAll({
        where: { id: { [Op.in]: sliced.map((p) => p.id) } },
      });
      const postsMap = new Map(posts.map((p) => [p.id, p]));
      const sorted = sliced.map((s) => postsMap.get(s.id)!).filter(Boolean);

      return { activeUser, posts: sorted.map((p) => p.toJSON()) };
    }

    case "terms": {
      return { activeUser };
    }

    default:
      return null;
  }
}
