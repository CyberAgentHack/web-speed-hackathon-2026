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

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      include: [
        {
          association: "user",
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      where: dateWhere,
    });
  }

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const normalizedOffset = Number.isFinite(offset) ? Math.max(0, offset ?? 0) : 0;
  const normalizedLimit =
    Number.isFinite(limit) && (limit ?? 0) > 0 ? limit : mergedPosts.length;

  const result = mergedPosts.slice(normalizedOffset, normalizedOffset + normalizedLimit);

  return res.status(200).type("application/json").send(result);
});
