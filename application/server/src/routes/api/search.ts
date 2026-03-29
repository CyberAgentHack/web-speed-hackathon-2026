import { Router } from "express";
import { Op, literal } from "sequelize";

import { Image, Post } from "@web-speed-hackathon-2026/server/src/models";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/analyze_sentiment.js";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

function toNonNegativeInteger(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(0, Math.trunc(parsed));
}

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send({ isNegative: false, posts: [] });
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);
  const sequelize = Post.sequelize;

  // キーワードも日付フィルターもない場合は空配列を返す
  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send({ isNegative: false, posts: [] });
  }
  if (sequelize == null) {
    throw new Error("Post sequelize is not initialized");
  }

  const limit = toNonNegativeInteger(req.query["limit"]);
  const offset = toNonNegativeInteger(req.query["offset"]);

  const whereClauses: string[] = [];
  if (keywords) {
    const escapedSearchTerm = sequelize.escape(`%${keywords}%`);
    whereClauses.push(
      `("SearchPost"."text" LIKE ${escapedSearchTerm} OR "SearchUser"."username" LIKE ${escapedSearchTerm} OR "SearchUser"."name" LIKE ${escapedSearchTerm})`,
    );
  }
  if (sinceDate) {
    whereClauses.push(`"SearchPost"."createdAt" >= ${sequelize.escape(sinceDate.toISOString())}`);
  }
  if (untilDate) {
    whereClauses.push(`"SearchPost"."createdAt" <= ${sequelize.escape(untilDate.toISOString())}`);
  }

  const paginationClauses: string[] = [];
  if (limit != null) {
    paginationClauses.push(`LIMIT ${limit}`);
  } else if (offset != null) {
    paginationClauses.push("LIMIT -1");
  }
  if (offset != null) {
    paginationClauses.push(`OFFSET ${offset}`);
  }

  const subquery = [
    'SELECT "SearchPost"."id"',
    'FROM "Posts" AS "SearchPost"',
    'INNER JOIN "Users" AS "SearchUser" ON "SearchUser"."id" = "SearchPost"."userId"',
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "",
    'ORDER BY "SearchPost"."createdAt" DESC, "SearchPost"."id" DESC',
    paginationClauses.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const [result, isNegative] = await Promise.all([
    Post.unscoped().findAll({
      include: [
        {
          association: "user",
          include: [{ association: "profileImage" }],
          required: true,
        },
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
        [{ model: Image, as: "images" }, "createdAt", "ASC"],
      ],
      where: {
        id: {
          [Op.in]: literal(`(${subquery})`),
        },
      },
    }),
    analyzeSentiment(keywords ?? ""),
  ]);

  return res.status(200).type("application/json").send({ isNegative, posts: result });
});
