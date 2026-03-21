import { Router } from "express";
import { Op, Order } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const postAttributes = {
  exclude: ["userId", "movieId", "soundId"],
};

const commonPostIncludes = [
  {
    association: "images",
    through: { attributes: [] },
  },
  { association: "movie" },
  { association: "sound" },
];

const defaultPostOrder: Order = [
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
  const sourceLimit = limit != null ? limit + (offset || 0) : undefined;

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

  const postsByText = await Post.unscoped().findAll({
    attributes: postAttributes,
    include: [
      {
        as: "user",
        model: User.unscoped(),
        include: [{ association: "profileImage" }],
      },
      ...commonPostIncludes,
    ],
    limit: sourceLimit,
    order: defaultPostOrder,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.unscoped().findAll({
      attributes: postAttributes,
      include: [
        {
          as: "user",
          model: User.unscoped(),
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        ...commonPostIncludes,
      ],
      limit: sourceLimit,
      order: defaultPostOrder,
      where: dateWhere,
    });
  }

  const postIdSet = new Set<string>();
  const mergedPosts: typeof postsByText = [];

  for (const post of [...postsByText, ...postsByUser]) {
    if (!postIdSet.has(post.id)) {
      postIdSet.add(post.id);
      mergedPosts.push(post);
    }
  }

  mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result =
    limit != null
      ? mergedPosts.slice(offset || 0, (offset || 0) + limit)
      : mergedPosts;

  const sanitizedResult = result.map((post) => {
    const postJson = post.toJSON() as Record<string, unknown>;
    const user = postJson["user"];

    if (user && typeof user === "object" && !Array.isArray(user)) {
      delete (user as Record<string, unknown>)["profileImageId"];
    }

    return postJson;
  });

  return res.status(200).type("application/json").send(sanitizedResult);
});
