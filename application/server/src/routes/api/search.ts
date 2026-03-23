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
  const MAX_LIMIT = 100;
  const limit =
    req.query["limit"] != null ? Math.min(Number(req.query["limit"]), MAX_LIMIT) : MAX_LIMIT;
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

  // Stage 1: ID のみ取得 (unscoped + User JOIN のみ → M2M なしで LIMIT/OFFSET 正確)
  const orConditions: Record<string | symbol, unknown>[] = [];
  if (searchTerm) {
    orConditions.push({ text: { [Op.like]: searchTerm } });
    orConditions.push({ "$user.username$": { [Op.like]: searchTerm } });
    orConditions.push({ "$user.name$": { [Op.like]: searchTerm } });
  }

  const postIdRows = await Post.unscoped().findAll({
    attributes: ["id"],
    ...(searchTerm
      ? {
          include: [
            {
              association: "user",
              attributes: [],
              required: false,
            },
          ],
        }
      : {}),
    where: {
      ...dateWhere,
      ...(orConditions.length > 0 ? { [Op.or]: orConditions } : {}),
    },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
    subQuery: false,
  });

  // Stage 2: フル post 取得 (defaultScope で全 association 込み)
  const posts =
    postIdRows.length > 0
      ? await Post.findAll({
          where: { id: { [Op.in]: postIdRows.map((p) => p.id) } },
          order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
          ],
        })
      : [];

  return res.status(200).type("application/json").send(posts);
});
