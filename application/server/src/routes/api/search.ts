import { Router } from "express";
import { Op } from "sequelize";
// @ts-expect-error - no types available
import analyzeSentiment from "negaposi-analyzer-ja";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";
import { getTokenizer } from "@web-speed-hackathon-2026/server/src/utils/tokenizer";

export const searchRouter = Router();

searchRouter.get("/search/sentiment", async (req, res) => {
  const query = req.query["q"];
  if (typeof query !== "string" || query.trim() === "") {
    return res.json({ label: "neutral" });
  }

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(query);
    const score = analyzeSentiment(tokens);
    
    // Determine label based on score threshold
    // Typically in negaposi-analyzer-ja, negative is < 0
    let label = "neutral";
    if (score < -0.1) {
      label = "negative";
    } else if (score > 0.1) {
      label = "positive";
    }

    return res.json({ label, score });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return res.json({ label: "neutral" });
  }
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

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    limit,
    offset,
    where: {
      ...textWhere,
      ...dateWhere,
    },
    attributes: { exclude: ["updatedAt"] },
    include: [
      {
        association: "user",
        attributes: { exclude: ["password", "updatedAt"] },
        include: [
          {
            association: "profileImage",
            attributes: { exclude: ["updatedAt"] },
          },
        ],
      },
      {
        association: "images",
        attributes: { exclude: ["updatedAt"] },
        through: { attributes: [] },
      },
      {
        association: "movie",
        attributes: { exclude: ["updatedAt"] },
      },
      {
        association: "sound",
        attributes: { exclude: ["updatedAt"] },
      },
    ],
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      attributes: { exclude: ["updatedAt"] },
      include: [
        {
          association: "user",
          attributes: { exclude: ["password", "updatedAt", "profileImageId"] },
          include: [
            {
              association: "profileImage",
              attributes: { exclude: ["updatedAt"] },
            },
          ],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
        },
        {
          association: "images",
          attributes: { exclude: ["updatedAt"] },
          through: { attributes: [] },
        },
        {
          association: "movie",
          attributes: { exclude: ["updatedAt"] },
        },
        {
          association: "sound",
          attributes: { exclude: ["updatedAt"] },
        },
      ],
      limit,
      offset,
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

  const result = mergedPosts.slice(offset || 0, (offset || 0) + (limit || mergedPosts.length));

  return res.status(200).type("application/json").send(result);
});