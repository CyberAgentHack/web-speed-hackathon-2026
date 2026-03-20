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
      const posts = await Post.scope("detail").findAll({ limit: 30, offset: 0 });
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
      const userPosts = await Post.scope("detail").findAll({
        where: { userId: user.id },
        limit: 30,
        offset: 0,
      });
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

      const postsByText = await Post.scope("detail").findAll({
        limit: 30,
        offset: 0,
        where: { ...textWhere, ...dateWhere },
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
                [Op.or]: [
                  { username: { [Op.like]: searchTerm } },
                  { name: { [Op.like]: searchTerm } },
                ],
              },
            },
            { association: "images", through: { attributes: [] } },
            { association: "movie" },
            { association: "sound" },
          ],
          limit: 30,
          offset: 0,
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
      const result = mergedPosts.slice(0, 30);

      return { activeUser, posts: result.map((p) => p.toJSON()) };
    }

    case "terms": {
      return { activeUser };
    }

    default:
      return null;
  }
}
