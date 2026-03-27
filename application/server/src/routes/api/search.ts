import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

function parseLimit(value: unknown, defaultValue: number, maxValue: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) {
    return defaultValue;
  }
  return Math.min(n, maxValue);
}

function parseOffset(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ items: [], hasMore: false });
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send({ items: [], hasMore: false });
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = parseLimit(req.query["limit"], 30, 50);
  const offset = parseOffset(req.query["offset"]);

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

  const matchingPosts = await Post.findAll({
    attributes: ["id"],
    include: searchTerm
      ? [
          {
            association: "user",
            attributes: [],
            required: false,
          },
        ]
      : [],
    limit: limit + 1,
    offset,
    where: {
      ...dateWhere,
      ...(searchTerm
        ? {
            [Op.or]: [
              { text: { [Op.like]: searchTerm } },
              { "$user.username$": { [Op.like]: searchTerm } },
              { "$user.name$": { [Op.like]: searchTerm } },
            ],
          }
        : {}),
    },
    order: [["id", "DESC"]],
    subQuery: false,
  });

  const hasMore = matchingPosts.length > limit;
  const pagedIds = matchingPosts.slice(0, limit).map((post) => post.id);

  if (pagedIds.length === 0) {
    return res.status(200).type("application/json").send({ items: [], hasMore });
  }

  const posts = await Post.scope("timeline").findAll({
    where: {
      id: {
        [Op.in]: pagedIds,
      },
    },
  });

  const postById = new Map(posts.map((post) => [post.id, post]));
  const items = pagedIds.map((id) => postById.get(id)).filter((post) => post != null);

  return res.status(200).type("application/json").send({ items, hasMore });
});
