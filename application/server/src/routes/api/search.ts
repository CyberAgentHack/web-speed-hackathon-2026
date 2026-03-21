import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

// 簡易的なキャッシュ
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5000;

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  const cacheKey = `search:${query}:${limit}:${offset}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).type("application/json").send(cached.data);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;

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

  const posts = await Post.findAll({
    include: [
      {
        association: "user",
        include: [{ association: "profileImage" }],
        required: true,
        where: searchTerm
          ? {
              [Op.or]: [
                { username: { [Op.like]: searchTerm } },
                { name: { [Op.like]: searchTerm } },
                { "$Post.text$": { [Op.like]: searchTerm } },
              ],
            }
          : undefined,
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
    subQuery: false,
    order: [["createdAt", "DESC"]],
    where: {
      ...dateWhere,
    },
  });

  searchCache.set(cacheKey, { data: posts, timestamp: Date.now() });

  return res.status(200).type("application/json").send(posts);
});
