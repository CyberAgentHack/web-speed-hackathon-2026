import { Router } from "express";
import { Op, type Includeable, type Order } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { serializePosts } from "@web-speed-hackathon-2026/server/src/utils/serialize_post";

export const searchRouter = Router();

const SEARCH_POST_INCLUDE: Includeable[] = [
  {
    association: "user",
    include: [{ association: "profileImage" }],
  },
  {
    association: "images",
    through: { attributes: [] },
  },
  { association: "movie" },
  { association: "sound" },
] ;

const SEARCH_POST_ORDER: Order = [
  ["id", "DESC"],
  ["images", "createdAt", "ASC"],
] ;

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  // 日付条件を構築
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.unscoped().findAll({
    include: SEARCH_POST_INCLUDE,
    limit,
    offset,
    order: SEARCH_POST_ORDER,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    const users = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      postsByUser = await Post.unscoped().findAll({
        include: SEARCH_POST_INCLUDE,
        limit,
        offset,
        order: SEARCH_POST_ORDER,
        where: {
          ...dateWhere,
          userId: {
            [Op.in]: userIds,
          },
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

  const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));

  return res.status(200).type("application/json").send(serializePosts(result));
});
