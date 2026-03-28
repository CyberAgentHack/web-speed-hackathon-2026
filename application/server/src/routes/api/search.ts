import { Router } from "express";
import { Op } from "sequelize";
import { Post } from "@web-speed-hackathon-2026/server/src/models";

export const searchRouter = Router();

searchRouter.get("/search", async (req, res) => {
  const q = req.query.q as string;

  if (!q) return res.json([]);

  const posts = await Post.findAll({
    where: {
      content: {
        [Op.like]: `${q}%`, // 前方一致に変更
      },
    },
    limit: 20,
  });

  res.json(posts);
});
