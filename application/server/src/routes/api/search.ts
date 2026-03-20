import { Router } from "express";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import analyze from "negaposi-analyzer-ja";
import path from "node:path";
import { Op } from "sequelize";
import { fileURLToPath } from "node:url";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dictionaryPath = path.join(__dirname, "../../../../public/dicts");

const tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>(
  (resolve, reject) => {
    kuromoji.builder({ dicPath: dictionaryPath }).build((error, tokenizer) => {
      if (error !== null || tokenizer === undefined) {
        reject(error ?? new Error("Failed to build kuromoji tokenizer"));
        return;
      }

      resolve(tokenizer);
    });
  },
);

function sentimentLabel(score: number): "positive" | "negative" | "neutral" {
  if (score > 0.1) {
    return "positive";
  }
  if (score < -0.1) {
    return "negative";
  }
  return "neutral";
}

searchRouter.get("/search/sentiment", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({
      score: 0,
      label: "neutral",
    });
  }

  const tokenizer = await tokenizerPromise;
  const tokens = tokenizer.tokenize(query);
  const score = analyze(tokens);

  return res.status(200).type("application/json").send({
    score,
    label: sentimentLabel(score),
  });
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
  const limit = req.query["limit"] != null
    ? Number(req.query["limit"])
    : undefined;
  const offset = req.query["offset"] != null
    ? Number(req.query["offset"])
    : undefined;

  // 日付条件を構築
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere = dateConditions.length > 0
    ? { createdAt: Object.assign({}, ...dateConditions) }
    : {};

  // テキスト検索条件
  const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

  const postsByText = await Post.findAll({
    limit,
    offset,
    subQuery: false,
    where: {
      ...textWhere,
      ...dateWhere,
    },
  });

  // ユーザー名/名前での検索（キーワードがある場合のみ）
  let postsByUser: typeof postsByText = [];
  if (searchTerm) {
    postsByUser = await Post.findAll({
      include: [
        {
          association: "user",
          include: [{ association: "profileImage" }],
          required: true,
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, {
              name: { [Op.like]: searchTerm },
            }],
          },
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      limit,
      offset,
      subQuery: false,
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

  const result = mergedPosts.slice(
    offset || 0,
    (offset || 0) + (limit || mergedPosts.length),
  );

  return res.status(200).type("application/json").send(result);
});
