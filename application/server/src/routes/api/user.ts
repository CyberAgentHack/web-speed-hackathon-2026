import { Router } from "express";
import { User, Post } from "@web-speed-hackathon-2026/server/src/models";

export const userRouter = Router();

// ユーザー詳細（投稿も一緒に取得）
userRouter.get("/users/:userId", async (req, res) => {
  const user = await User.findByPk(req.params.userId, {
    attributes: ["id", "name", "iconUrl"],
    include: [
      {
        model: Post,
        limit: 20,
        order: [["createdAt", "DESC"]],
      },
    ],
  });

  if (!user) return res.status(404).end();

  res.json(user);
});
