import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

function parseNonNegativeInteger(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

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
  const limit = parseNonNegativeInteger(req.query["limit"]);
  const offset = parseNonNegativeInteger(req.query["offset"]);

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

  const searchWhere = searchTerm
    ? {
        [Op.or]: [
          { text: { [Op.like]: searchTerm } },
          { "$user.username$": { [Op.like]: searchTerm } },
          { "$user.name$": { [Op.like]: searchTerm } },
        ],
      }
    : {};

  const posts = await Post.findAll({
    limit,
    offset,
    where: {
      ...searchWhere,
      ...dateWhere,
    },
    subQuery: false,
  });

  return res.status(200).type("application/json").send(posts);
});
