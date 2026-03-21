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

  // Step 1: アソシエーションなしでマッチするPost IDとcreatedAtのみを取得（軽量クエリ）
  const idMap = new Map<string, Date>();

  if (searchTerm) {
    const [textMatches, userMatches] = await Promise.all([
      Post.findAll({
        attributes: ["id", "createdAt"],
        where: { text: { [Op.like]: searchTerm }, ...dateWhere },
      }),
      Post.findAll({
        attributes: ["id", "createdAt"],
        include: [
          {
            association: "user",
            attributes: [],
            required: true,
            where: {
              [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
            },
          },
        ],
        where: dateWhere,
      }),
    ]);
    for (const p of textMatches) idMap.set(p.id, p.createdAt);
    for (const p of userMatches) {
      if (!idMap.has(p.id)) idMap.set(p.id, p.createdAt);
    }
  } else {
    const dateMatches = await Post.findAll({
      attributes: ["id", "createdAt"],
      where: dateWhere,
    });
    for (const p of dateMatches) idMap.set(p.id, p.createdAt);
  }

  // createdAt降順でソートしてページネーションをIDリストに適用
  const sortedIds = Array.from(idMap.entries())
    .sort(([, a], [, b]) => b.getTime() - a.getTime())
    .map(([id]) => id);

  const start = offset ?? 0;
  const paginatedIds = limit != null ? sortedIds.slice(start, start + limit) : sortedIds.slice(start);

  if (paginatedIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Step 2: ページネーション済みIDのみにアソシエーションをJOINして取得
  // subQuery: false でSequelizeのサブクエリ生成を抑止しprofileImageIdの参照エラーを防ぐ
  const posts = await Post.findAll({
    where: { id: { [Op.in]: paginatedIds } },
    include: [
      {
        association: "user",
        include: [{ association: "profileImage" }],
      },
      {
        association: "images",
        through: { attributes: [] },
      },
      { association: "movie" },
      { association: "sound" },
    ],
    order: [["id", "DESC"], ["images", "createdAt", "ASC"]],
    subQuery: false,
  });

  // IDリストの順序（createdAt降順）に並べ直す
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const result = paginatedIds.map((id) => postMap.get(id)).filter(Boolean);

  return res.status(200).type("application/json").send(result);
});
