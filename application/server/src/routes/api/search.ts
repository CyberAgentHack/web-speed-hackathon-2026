import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/negaposi_analyzer";
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
  const limit =
    req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset =
    req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  // 日付条件を構築
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0
      ? { createdAt: Object.assign({}, ...dateConditions) }
      : {};

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  // Stage 1: IDだけ1クエリで取得（テキスト一致 OR ユーザー名一致）
  const postWhere: any = { ...dateWhere };
  if (searchTerm) {
    postWhere[Op.or] = [
      { text: { [Op.like]: searchTerm } },
      { "$user.username$": { [Op.like]: searchTerm } },
      { "$user.name$": { [Op.like]: searchTerm } },
    ];
  } else {
    Object.assign(postWhere, textWhere);
  }

  const [ids, sentiment] = await Promise.all([
    Post.unscoped().findAll({
      attributes: ["id"],
      include: searchTerm
        ? [{ association: "user", attributes: [], required: false }]
        : [],
      where: postWhere,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      raw: true,
      subQuery: false,
    }),
    keywords
      ? analyzeSentiment(keywords).then((r) => r.label)
      : Promise.resolve("neutral" as const),
  ]);

  const postIds = ids.map((r) => r.id);

  // Stage 2: IDで本体を取得（defaultScope適用）
  const result = postIds.length > 0
    ? await Post.findAll({
        where: { id: { [Op.in]: postIds } },
        order: [["createdAt", "DESC"]],
      })
    : [];

  res.setHeader("X-Sentiment", sentiment);

  return res.status(200).type("application/json").send(result);
});
