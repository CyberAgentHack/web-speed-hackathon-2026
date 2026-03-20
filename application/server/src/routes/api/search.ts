import { Router } from "express";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { createPostPayloadQuery } from "@web-speed-hackathon-2026/server/src/routes/api/post_payloads";
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

  const keywordConditions: object[] = [];
  if (searchTerm != null) {
    keywordConditions.push({ text: { [Op.like]: searchTerm } });

    const users = await User.unscoped().findAll({
      attributes: ["id"],
      raw: true,
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const userIds = users.map(({ id }) => id);

    if (userIds.length > 0) {
      keywordConditions.push({ userId: { [Op.in]: userIds } });
    }
  }

  const result = await Post.unscoped().findAll(
    createPostPayloadQuery({
      limit,
      offset,
      where: {
        ...dateWhere,
        ...(keywordConditions.length > 0 ? { [Op.or]: keywordConditions } : {}),
      },
    }),
  );

  return res.status(200).type("application/json").send(result);
});
