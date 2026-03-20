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
  const requestedLimit = req.query["limit"] != null ? Number(req.query["limit"]) : 30;
  const requestedOffset = req.query["offset"] != null ? Number(req.query["offset"]) : 0;

  // マージ後に正しく offset/limit でスライスできるよう、各クエリは
  // DB 側の offset なしで requestedOffset + requestedLimit 件取得する
  const fetchLimit = requestedOffset + requestedLimit;

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

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const [postsByText, postsByUser] = await Promise.all([
    Post.findAll({
      limit: fetchLimit,
      order: [["createdAt", "DESC"]],
      where: {
        ...textWhere,
        ...dateWhere,
      },
    }),
    // ユーザー名/名前での検索（キーワードがある場合のみ）
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
          limit: fetchLimit,
          order: [["createdAt", "DESC"]],
          where: dateWhere,
        })
      : Promise.resolve([] as typeof postsByText),
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

  const result = mergedPosts.slice(requestedOffset, requestedOffset + requestedLimit);

  return res.status(200).type("application/json").send(result);
});
