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

  const whereConditions: Record<string, unknown>[] = [];

  if (searchTerm) {
    whereConditions.push({
      [Op.or]: [
        { text: { [Op.like]: searchTerm } },
        { "$user.username$": { [Op.like]: searchTerm } },
        { "$user.name$": { [Op.like]: searchTerm } },
      ],
    });
  }

  if (Object.keys(dateWhere).length > 0) {
    whereConditions.push(dateWhere);
  }

  // Phase 1: マッチするPost IDを正しいLIMIT/OFFSETで取得（images JOINなし）
  const matchingRows = await Post.unscoped().findAll({
    attributes: ["id"],
    include: [
      {
        association: "user",
        attributes: [],
        required: false,
      },
    ],
    where: whereConditions.length > 0 ? { [Op.and]: whereConditions } : {},
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    subQuery: false,
    raw: true,
  });

  const ids = matchingRows.map((r: { id: string }) => r.id);

  // Phase 2: IDリストでフルデータ取得（defaultScope適用）
  const posts =
    ids.length > 0
      ? await Post.findAll({
          where: { id: { [Op.in]: ids } },
        })
      : [];

  // 元のコードと同じ createdAt DESC でソート
  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.setHeader("Cache-Control", "public, max-age=5");
  return res.status(200).type("application/json").send(posts);
});
