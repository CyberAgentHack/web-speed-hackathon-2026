import { Hono } from "hono";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = new Hono();

searchRouter.get("/search", async (c) => {
  const query = c.req.query("q");

  if (typeof query !== "string" || query.trim() === "") {
    return c.json([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return c.json([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");
  const limit = limitParam != null ? Number(limitParam) : undefined;
  const offset = offsetParam != null ? Number(offsetParam) : undefined;

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

  // OR条件を構築（defaultScopeと競合しないよう userId FK でフィルタ）
  const orConditions: object[] = [];

  if (searchTerm) {
    // テキスト検索条件
    orConditions.push({ text: { [Op.like]: searchTerm } });

    // ユーザー名/名前での検索：先にユーザーIDを取得してからPostをフィルタ
    const matchingUsers = await User.findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [
          { username: { [Op.like]: searchTerm } },
          { name: { [Op.like]: searchTerm } },
        ],
      },
    });

    if (matchingUsers.length > 0) {
      orConditions.push({ userId: { [Op.in]: matchingUsers.map((u) => u.id) } });
    }
  }

  const posts = await Post.findAll({
    limit,
    offset,
    where: {
      ...(orConditions.length > 0 ? { [Op.or]: orConditions } : {}),
      ...dateWhere,
    },
    order: [["createdAt", "DESC"]],
  });

  return c.json(posts);
});
