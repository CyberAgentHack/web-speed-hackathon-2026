import { Router } from "express";
import { Op, WhereOptions } from "sequelize";

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

  const whereConditions: WhereOptions<Post>[] = [];

  if (searchTerm) {
    whereConditions.push({
      [Op.or]: [
        { text: { [Op.like]: searchTerm } },
        { "$user.username$": { [Op.like]: searchTerm } },
        { "$user.name$": { [Op.like]: searchTerm } },
      ],
    });
  }
  if (sinceDate) {
    whereConditions.push({ createdAt: { [Op.gte]: sinceDate } });
  }
  if (untilDate) {
    whereConditions.push({ createdAt: { [Op.lte]: untilDate } });
  }

  const posts = await Post.findAll({
    subQuery: false,
    where: { [Op.and]: whereConditions },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return res.status(200).type("application/json").send(posts);
});
