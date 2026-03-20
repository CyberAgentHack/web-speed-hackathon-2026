import { Router } from "express";
import { Op } from "sequelize";

import { Post, User } from "@web-speed-hackathon-2026/server/src/models";
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
  const where: Record<string | symbol, unknown> = {};

  if (sinceDate || untilDate) {
    const createdAt: Record<symbol, Date> = {};
    if (sinceDate) {
      createdAt[Op.gte] = sinceDate;
    }
    if (untilDate) {
      createdAt[Op.lte] = untilDate;
    }
    where["createdAt"] = createdAt;
  }

  if (searchTerm) {
    const users = await User.unscoped().findAll({
      attributes: ["id"],
      where: {
        [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
      },
    });
    const userIds = users.map((user) => user.id);

    where[Op.or] = [
      { text: { [Op.like]: searchTerm } },
      ...(userIds.length > 0 ? [{ userId: { [Op.in]: userIds } }] : []),
    ];
  }

  const idRows = await Post.unscoped().findAll({
    attributes: ["id"],
    limit,
    offset,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    where,
  });
  const postIds = idRows.map((row) => row.id);

  if (postIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const posts = await Post.findAll({
    where: {
      id: postIds,
    },
  });

  const postById = new Map(posts.map((post) => [post.id, post]));
  const orderedPosts = postIds
    .map((postId) => postById.get(postId))
    .filter((post): post is Post => post !== undefined);

  return res.status(200).type("application/json").send(orderedPosts);
});
