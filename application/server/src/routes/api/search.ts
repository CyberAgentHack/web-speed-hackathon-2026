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

  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  const dateWhere: Record<symbol, Date>[] = [];
  if (sinceDate) dateWhere.push({ [Op.gte]: sinceDate });
  if (untilDate) dateWhere.push({ [Op.lte]: untilDate });
  const dateCondition = dateWhere.length > 0 ? { createdAt: Object.assign({}, ...dateWhere) } : {};

  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  // テキスト検索とユーザー名検索を並列実行して重複除去
  // ページネーションはマージ後に適用するため、各クエリでは limit/offset を使わない
  const [postsByText, postsByUser] = await Promise.all([
    Post.findAll({ where: { ...textWhere, ...dateCondition } }),
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
            { association: "images", through: { attributes: [] } },
            { association: "movie" },
            { association: "sound" },
          ],
          where: dateCondition,
        })
      : Promise.resolve([]),
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

  const start = offset ?? 0;
  const result = mergedPosts.slice(start, start + (limit ?? mergedPosts.length));

  return res.status(200).type("application/json").send(result);
});
