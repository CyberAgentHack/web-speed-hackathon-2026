import { Router } from "express";
import { Op, WhereOptions, col, where } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { analyzeSearchSentiment } from "@web-speed-hackathon-2026/server/src/utils/analyze_search_sentiment";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

searchRouter.get("/search/sentiment", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ label: "neutral", score: 0 });
  }

  const { keywords } = parseSearchQuery(query);

  if (!keywords) {
    return res.status(200).type("application/json").send({ label: "neutral", score: 0 });
  }

  const sentiment = await analyzeSearchSentiment(keywords);
  return res.status(200).type("application/json").send(sentiment);
});

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

  const keywordWhere: WhereOptions<Post> = searchTerm
    ? {
        [Op.or]: [
          { text: { [Op.like]: searchTerm } },
          where(col("user.username"), { [Op.like]: searchTerm }),
          where(col("user.name"), { [Op.like]: searchTerm }),
        ],
      }
    : {};

  const matchingPostRows = await Post.findAll({
    attributes: ["id"],
    include: searchTerm
      ? [
          {
            association: "user",
            attributes: [],
            model: User,
            required: false,
          },
        ]
      : [],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    subQuery: false,
    where: {
      ...dateWhere,
      ...keywordWhere,
    },
  });

  const postIds = matchingPostRows.map(({ id }) => id);

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

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const orderedPosts = postIds.flatMap((postId) => {
    const post = postsById.get(postId);
    return post == null ? [] : [post];
  });

  return res.status(200).type("application/json").send(orderedPosts);
});
