import { Router } from "express";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ posts: [], totalCount: 0 });
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send({ posts: [], totalCount: 0 });
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

  const where: Record<string | symbol, unknown> = {
    ...dateWhere,
  };

  if (searchTerm) {
    const matchedUsers = await User.findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });

    const matchedUserIds = matchedUsers.map((user) => user.id);

    const searchConditions: Array<Record<string | symbol, unknown>> = [
      { text: { [Op.like]: searchTerm } },
    ];

    if (matchedUserIds.length > 0) {
      searchConditions.push({ userId: { [Op.in]: matchedUserIds } });
    }

    where[Op.or] = searchConditions;
  }

  const totalCount = await Post.unscoped().count({ where });

  if (totalCount === 0) {
    return res.status(200).type("application/json").send({ posts: [], totalCount: 0 });
  }

  const pagePostIds = await Post.unscoped().findAll({
    attributes: ["id"],
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    where,
  });

  const orderedIds = pagePostIds.map((post) => post.id);

  if (orderedIds.length === 0) {
    return res.status(200).type("application/json").send({ posts: [], totalCount });
  }

  const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));
  const posts = await Post.findAll({
    where: {
      id: { [Op.in]: orderedIds },
    },
  });

  posts.sort((left, right) => (orderIndex.get(left.id) ?? 0) - (orderIndex.get(right.id) ?? 0));

  return res.status(200).type("application/json").send({ posts, totalCount });
});
