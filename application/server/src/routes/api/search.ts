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

function parseIntegerParam(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

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
  const limitParam = parseIntegerParam(req.query["limit"]);
  const offsetParam = parseIntegerParam(req.query["offset"]);
  const limit = Math.min(Math.max(limitParam ?? 30, 1), 100);
  const offset = Math.max(offsetParam ?? 0, 0);

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

  const whereClauses: object[] = [];
  if (Object.keys(dateWhere).length > 0) {
    whereClauses.push(dateWhere);
  }
  if (searchTerm) {
    whereClauses.push({
      [Op.or]: [
        { text: { [Op.like]: searchTerm } },
        { "$user.username$": { [Op.like]: searchTerm } },
        { "$user.name$": { [Op.like]: searchTerm } },
      ],
    });
  }

  const where = whereClauses.length > 0
    ? { [Op.and]: whereClauses }
    : undefined;

  const result = await Post.findAll({
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
      ["images", "createdAt", "ASC"],
    ],
    where,
  });

  return res.status(200).type("application/json").send(result);
});
