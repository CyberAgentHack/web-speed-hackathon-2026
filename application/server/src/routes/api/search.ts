import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const searchCache = new Map<string, { body: string; expireAt: number }>();

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

  const cacheKey = `${query}:${limit}:${offset}`;
  const now = Date.now();
  const cached = searchCache.get(cacheKey);
  if (cached != null && cached.expireAt > now) {
    return res.status(200).type("application/json").send(cached.body);
  }

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

  const postIncludes = [
    {
      association: "user",
      attributes: { exclude: ["profileImageId"] },
      include: [{ association: "profileImage" }],
      required: true,
    },
    {
      association: "images",
      through: { attributes: [] },
    },
    { association: "movie" },
    { association: "sound" },
  ];

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  // テキスト検索とユーザー名/名前検索を並列実行（limit/offsetなしで全件取得）
  const [postsByText, postsByUser] = await Promise.all([
    Post.findAll({
      include: postIncludes,
      where: {
        ...textWhere,
        ...dateWhere,
      },
    }),
    searchTerm
      ? Post.findAll({
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
            {
              association: "images",
              through: { attributes: [] },
            },
            { association: "movie" },
            { association: "sound" },
          ],
          where: dateWhere,
        })
      : Promise.resolve([]),
  ]);

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // マージ後にページネーションを1回だけ適用
  const result = mergedPosts.slice(offset || 0, limit != null ? (offset || 0) + limit : undefined);

  const body = JSON.stringify(result);
  searchCache.set(cacheKey, { body, expireAt: now + 10000 });

  return res.status(200).type("application/json").send(body);
});
