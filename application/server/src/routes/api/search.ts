import { Hono } from "hono";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import type { AppEnv } from "@web-speed-hackathon-2026/server/src/types";

export const searchRouter = new Hono<AppEnv>();

searchRouter.get("/search", async (c) => {
  const query = c.req.query("q");

  if (typeof query !== "string" || query.trim() === "") {
    return c.json([], 200);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return c.json([], 200);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = c.req.query("limit") != null ? Number(c.req.query("limit")) : undefined;
  const offset = c.req.query("offset") != null ? Number(c.req.query("offset")) : undefined;

  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

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

  const sortedIds = Array.from(idMap.entries())
    .sort(([, a], [, b]) => b.getTime() - a.getTime())
    .map(([id]) => id);

  const start = offset ?? 0;
  const paginatedIds = limit != null ? sortedIds.slice(start, start + limit) : sortedIds.slice(start);

  if (paginatedIds.length === 0) {
    return c.json([], 200);
  }

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

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const result = paginatedIds.map((id) => postMap.get(id)).filter(Boolean);

  return c.json(result, 200);
});
