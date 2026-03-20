import { Router } from "express";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
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

  // Build date conditions
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  // Build combined where clause: text match OR user match
  const whereClause: Record<string | symbol, unknown> = { ...dateWhere };

  if (searchTerm) {
    whereClause[Op.or] = [
      { text: { [Op.like]: searchTerm } },
      { "$user.username$": { [Op.like]: searchTerm } },
      { "$user.name$": { [Op.like]: searchTerm } },
    ];
  }

  // Find matching post IDs first using unscoped to avoid eager loading JOINs
  const matchedRows = await Post.unscoped().findAll({
    attributes: ["id"],
    include: [{ model: User.unscoped(), as: "user", attributes: ["id", "username", "name"] }],
    where: whereClause,
    limit,
    offset,
    order: [["id", "DESC"]],
    subQuery: false,
    raw: true,
  });

  // Fetch full posts with default scope (eager loading)
  const posts = matchedRows.length > 0
    ? await Post.findAll({
        where: { id: matchedRows.map((r: { id: string }) => r.id) },
      })
    : [];

  return res.status(200).type("application/json").send(posts);
});
