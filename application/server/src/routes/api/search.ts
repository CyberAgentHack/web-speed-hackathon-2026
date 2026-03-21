import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

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

  // テキスト検索条件とユーザー名検索を統合
  const conditions: Record<string, unknown>[] = [];
  if (searchTerm) {
    conditions.push({ text: { [Op.like]: searchTerm } });
    conditions.push({ '$user.username$': { [Op.like]: searchTerm } });
    conditions.push({ '$user.name$': { [Op.like]: searchTerm } });
  }

  res.setHeader("Cache-Control", "public, max-age=30");

  const result = await Post.findAll({
    where: {
      ...dateWhere,
      ...(conditions.length > 0 ? { [Op.or]: conditions } : {}),
    },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    subQuery: false,
  });

  return res.status(200).type("application/json").send(result);
});
