import { Router } from "express";
import { Op, type Includeable, type Order } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { serializePosts } from "@web-speed-hackathon-2026/server/src/utils/serialize_post";

export const searchRouter = Router();

const SEARCH_POST_INCLUDE: Includeable[] = [
  {
    association: "user",
    attributes: { exclude: ["profileImageId"] },
    include: [{ association: "profileImage" }],
    required: true,
  },
  {
    association: "images",
    through: { attributes: [] },
  },
  { association: "movie" },
  { association: "sound" },
];

const SEARCH_POST_ORDER: Order = [
  ["createdAt", "DESC"],
  ["id", "DESC"],
  ["images", "createdAt", "ASC"],
];

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
  const searchWhere =
    searchTerm != null
      ? {
          [Op.or]: [
            { text: { [Op.like]: searchTerm } },
            { "$user.username$": { [Op.like]: searchTerm } },
            { "$user.name$": { [Op.like]: searchTerm } },
          ],
        }
      : {};

  const matchedPosts = await Post.unscoped().findAll({
    attributes: ["id"],
    include: [
      {
        association: "user",
        attributes: [],
        required: true,
      },
    ],
    limit,
    offset,
    where: {
      ...dateWhere,
      ...searchWhere,
    },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  const postIds = matchedPosts.map((post) => post.id);
  if (postIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const result = await Post.unscoped().findAll({
    include: SEARCH_POST_INCLUDE,
    order: SEARCH_POST_ORDER,
    where: {
      id: {
        [Op.in]: postIds,
      },
    },
  });

  return res.status(200).type("application/json").send(serializePosts(result));
});
