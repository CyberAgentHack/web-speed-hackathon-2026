import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

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
  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : DEFAULT_LIMIT;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : DEFAULT_OFFSET;

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

  // オリジナルのロジックを ID のみの軽量版で実行
  const textIds = await Post.unscoped().findAll({
    attributes: ["id", "createdAt"],
    where: { ...textWhere, ...dateWhere },
    raw: true,
  });

  let userIds: Array<{ id: string; createdAt: Date }> = [];
  if (searchTerm) {
    userIds = await Post.unscoped().findAll({
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
      raw: true,
    });
  }

  const idSet = new Set<string>();
  const merged: Array<{ id: string; createdAt: Date }> = [];
  for (const row of [...textIds, ...userIds]) {
    if (!idSet.has(row.id)) {
      idSet.add(row.id);
      merged.push(row);
    }
  }
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageIds = merged.slice(offset, offset + limit).map((row) => row.id);

  if (pageIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // ページ分に切り詰めた ID の配列でエンティティを取得
  const posts = await Post.findAll({
    where: { id: pageIds },
  });

  // findAll の結果を元のソート順に合わせる
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const sorted = pageIds.map((id) => postMap.get(id)).filter(Boolean);

  return res.status(200).type("application/json").send(sorted);
});
