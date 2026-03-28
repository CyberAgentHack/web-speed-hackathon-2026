import { Router } from "express";
import { Op } from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query.js";

export const searchRouter = Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

function parseLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

function parseOffset(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

searchRouter.get("/search", async (req, res) => {
  const query = req.query["q"];

  if (typeof query !== "string" || query.trim() === "") {
    return res.status(200).type("application/json").send([]);
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(query);

  if (!keywords && !sinceDate && !untilDate) {
    return res.status(200).type("application/json").send([]);
  }

  const searchTerm = keywords ? `%${keywords}%` : null;
  const limit = parseLimit(req.query["limit"]);
  const offset = parseOffset(req.query["offset"]);

  const createdAt: Record<symbol, Date> = {};
  if (sinceDate) {
    createdAt[Op.gte] = sinceDate;
  }
  if (untilDate) {
    createdAt[Op.lte] = untilDate;
  }

  const where = {
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  } as Record<string, unknown>;

  const posts = await Post.findAll({
    include: [
      {
        association: "user",
        attributes: { exclude: ["profileImageId"] },
        include: [{ association: "profileImage" }],
        required: !!searchTerm,
        ...(searchTerm
          ? {
              where: {
                [Op.or]: [
                  { username: { [Op.like]: searchTerm } },
                  { name: { [Op.like]: searchTerm } },
                ],
              },
            }
          : {}),
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
    order: [["createdAt", "DESC"]],
    where: searchTerm
      ? {
          ...where,
          [Op.or]: [
            { text: { [Op.like]: searchTerm } },
            { "$user.username$": { [Op.like]: searchTerm } },
            { "$user.name$": { [Op.like]: searchTerm } },
          ],
        }
      : where,
  });

  return res.status(200).type("application/json").send(posts);
});