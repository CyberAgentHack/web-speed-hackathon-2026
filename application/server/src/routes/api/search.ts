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

  // テキスト検索と ユーザー名/名前での検索を Op.or で統合
  const orConditions: Array<Record<string, unknown>> = [];
  if (searchTerm) {
    orConditions.push({ text: { [Op.like]: searchTerm } });
  }

  const posts = await Post.findAll({
    include: [
      {
        association: "user",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
        required: searchTerm ? true : false,
        where: searchTerm
          ? {
              [Op.or]: [
                { username: { [Op.like]: searchTerm } },
                { name: { [Op.like]: searchTerm } },
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
    where:
      orConditions.length > 0
        ? {
            [Op.or]: orConditions,
            ...dateWhere,
          }
        : dateWhere,
  });

  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Apply limit only (offset is already applied at DB query level)
  const result = posts.slice(0, limit || posts.length);

  return res.status(200).type("application/json").send(result);
});
