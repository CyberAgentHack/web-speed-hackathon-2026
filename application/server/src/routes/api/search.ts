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

  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  const keywordWhere = searchTerm
    ? {
        [Op.or]: [
          { text: { [Op.like]: searchTerm } },
          { "$user.username$": { [Op.like]: searchTerm } },
          { "$user.name$": { [Op.like]: searchTerm } },
        ],
      }
    : {};

  // Step 1: Get matching post IDs with correct pagination (unscoped to avoid images JOIN duplication)
  const matchingPosts = await Post.unscoped().findAll({
    where: {
      ...keywordWhere,
      ...dateWhere,
    },
    include: searchTerm
      ? [{ association: "user", attributes: ["username", "name"] }]
      : [],
    attributes: ["id", "createdAt"],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    subQuery: false,
  });

  if (matchingPosts.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Step 2: Fetch full post data for those IDs (preserving order)
  const ids = matchingPosts.map((p) => p.id);
  const posts = await Post.findAll({
    where: { id: { [Op.in]: ids } },
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).type("application/json").send(posts);
});
