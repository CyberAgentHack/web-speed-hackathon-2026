import { Router } from "express";
import { InferAttributes, Op, WhereOptions } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/analyze_sentiment.js";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const NEUTRAL_SENTIMENT = {
  label: "neutral",
  score: 0,
} as const;

searchRouter.get("/search/sentiment", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send(NEUTRAL_SENTIMENT);
  }

  const { keywords } = parseSearchQuery(query);

  if (keywords === "") {
    return res.status(200).type("application/json").send(NEUTRAL_SENTIMENT);
  }

  const sentiment = await analyzeSentiment(keywords);
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

  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;
  const andConditions: WhereOptions<InferAttributes<Post>>[] = [];

  if (sinceDate || untilDate) {
    const createdAtCondition: Record<symbol, Date> = {};
    if (sinceDate) {
      createdAtCondition[Op.gte] = sinceDate;
    }
    if (untilDate) {
      createdAtCondition[Op.lte] = untilDate;
    }
    andConditions.push({ createdAt: createdAtCondition });
  }

  if (keywords) {
    const searchTerm = `%${keywords}%`;
    const matchingUsers = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });

    const orConditions: WhereOptions<InferAttributes<Post>>[] = [{ text: { [Op.like]: searchTerm } }];
    if (matchingUsers.length > 0) {
      orConditions.push({ userId: { [Op.in]: matchingUsers.map((user) => user.id) } });
    }
    andConditions.push({ [Op.or]: orConditions });
  }

  const posts = await Post.findAll({
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
      ["images", "createdAt", "ASC"],
    ],
    where: andConditions.length > 0 ? { [Op.and]: andConditions } : undefined,
  });

  return res.status(200).type("application/json").send(posts);
});
