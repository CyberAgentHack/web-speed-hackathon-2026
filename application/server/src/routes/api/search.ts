import { Router } from "express";
import { Op, type WhereOptions } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { resolvePagination } from "@web-speed-hackathon-2026/server/src/utils/pagination";
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

  const { limit, offset } = resolvePagination(req.query["limit"], req.query["offset"], {
    maxLimit: 50,
  });

  const whereConditions: WhereOptions[] = [];

  // 日付条件を構築
  const createdAtCondition: Record<symbol, Date> = {};
  let hasDateFilter = false;
  if (sinceDate) {
    createdAtCondition[Op.gte] = sinceDate;
    hasDateFilter = true;
  }
  if (untilDate) {
    createdAtCondition[Op.lte] = untilDate;
    hasDateFilter = true;
  }
  if (hasDateFilter) {
    whereConditions.push({ createdAt: createdAtCondition });
  }

  if (keywords) {
    const searchTerm = `%${keywords}%`;
    whereConditions.push({
      [Op.or]: [
        { text: { [Op.like]: searchTerm } },
        { "$user.username$": { [Op.like]: searchTerm } },
        { "$user.name$": { [Op.like]: searchTerm } },
      ],
    });
  }

  const where = whereConditions.length > 0 ? ({ [Op.and]: whereConditions } as WhereOptions) : {};

  const matchedPosts = await Post.unscoped().findAll({
    attributes: ["id"],
    include: [
      {
        model: User.unscoped(),
        as: "user",
        attributes: [],
        required: true,
      },
    ],
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    subQuery: false,
    where,
  });

  const postIds = matchedPosts.map((post) => post.id);
  if (postIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const posts = await Post.findAll({
    where: {
      id: {
        [Op.in]: postIds,
      },
    },
  });

  const postIdToIndex = new Map(postIds.map((postId, index) => [postId, index]));
  const orderedPosts = posts
    .slice()
    .sort(
      (a, b) =>
        (postIdToIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (postIdToIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );

  return res.status(200).type("application/json").send(orderedPosts);
});
