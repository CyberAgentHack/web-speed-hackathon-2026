import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const limit = req.query["limit"] != null ? Number(req.query["limit"]) : undefined;
  const offset = req.query["offset"] != null ? Number(req.query["offset"]) : undefined;

  const searchTerm = keywords ? `%${keywords}%` : null;

  // 日付条件
  const dateConditions: Record<symbol, Date>[] = [];
  if (sinceDate) {
    dateConditions.push({ [Op.gte]: sinceDate });
  }
  if (untilDate) {
    dateConditions.push({ [Op.lte]: untilDate });
  }
  const dateWhere =
    dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

  // ユーザー名/表示名でマッチするユーザーIDを先に取得（軽量クエリ）
  const matchingUserIds = searchTerm
    ? await User.unscoped()
        .findAll({
          where: {
            [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
          },
          attributes: ["id"],
          raw: true,
        })
        .then((users) => users.map((u) => u.id))
    : [];

  // テキスト + ユーザーID を OR で統合
  const orConditions: any[] = [];
  if (searchTerm) {
    orConditions.push({ text: { [Op.like]: searchTerm } });
  }
  if (matchingUserIds.length > 0) {
    orConditions.push({ userId: { [Op.in]: matchingUserIds } });
  }

  // Step 1: unscopedでIDだけ取得し、DB側でソート+ページネーション
  const matchedIds = await Post.unscoped().findAll({
    attributes: ["id"],
    where: {
      ...dateWhere,
      ...(orConditions.length > 0 ? { [Op.or]: orConditions } : {}),
    },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    raw: true,
  });

  if (matchedIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Step 2: defaultScope（user, images, movie, sound）付きで取得
  const posts = await Post.findAll({
    where: { id: { [Op.in]: matchedIds.map((r) => r.id) } },
  });

  // defaultScopeのorderはid DESCなので、createdAt DESCに再ソート
  posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return res.status(200).type("application/json").send(posts);
});
