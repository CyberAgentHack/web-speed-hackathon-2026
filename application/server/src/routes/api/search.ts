import { Router } from "express";
import { Op, WhereOptions, Includeable } from "sequelize";

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
  const dateWhere: WhereOptions =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  // 検索条件を1つのクエリにまとめる
  const whereConditions: WhereOptions[] = [];

  // テキスト検索条件
  if (searchTerm) {
    whereConditions.push({ text: { [Op.like]: searchTerm } });
    // ユーザー名/名前はincludeのwhereで処理するため、ここでは追加しない
  }

  // キーワードがある場合: テキストまたはユーザー名/名前でマッチ
  // キーワードがない場合: 日付フィルターのみ
  const include: Includeable[] = [
    {
      association: "user",
      attributes: { exclude: ["profileImageId"] },
      include: [{ association: "profileImage" }],
      // キーワードがある場合、ユーザー名/名前でもマッチさせるためにrequiredをfalseに
      required: false,
    },
    {
      association: "images",
      through: { attributes: [] },
    },
    { association: "movie" },
    { association: "sound" },
  ];

  // 最終的なwhere条件を構築
  let finalWhere: WhereOptions;
  if (searchTerm) {
    // テキストまたはユーザー名/名前でマッチ + 日付条件
    finalWhere = {
      ...dateWhere,
      [Op.or]: [
        { text: { [Op.like]: searchTerm } },
        { "$user.username$": { [Op.like]: searchTerm } },
        { "$user.name$": { [Op.like]: searchTerm } },
      ],
    };
  } else {
    // 日付フィルターのみ
    finalWhere = dateWhere;
  }

  const posts = await Post.findAll({
    include,
    limit,
    offset,
    where: finalWhere,
    order: [["createdAt", "DESC"]],
    subQuery: false, // JOINを使用してパフォーマンス向上
  });

  return res.status(200).type("application/json").send(posts);
});
