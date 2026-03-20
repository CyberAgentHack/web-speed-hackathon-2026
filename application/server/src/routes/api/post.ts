import { Router } from "express";
import httpErrors from "http-errors";

import { Comment, Post } from "@web-speed-hackathon-2026/server/src/models";
import { getWaveform } from "@web-speed-hackathon-2026/server/src/utils/waveform_cache";

function attachWaveform(postJson: any): any {
  if (postJson.sound && postJson.sound.id) {
    const waveform = getWaveform(postJson.sound.id);
    if (waveform) {
      postJson.sound.waveform = waveform;
    }
  }
  return postJson;
}

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
  const posts = await Post.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
  });

  const postsJson = posts.map((p) => attachWaveform(p.toJSON()));
  return res.status(200).type("application/json").send(postsJson);
});

postRouter.get("/posts/:postId", async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  if (post === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(attachWaveform(post.toJSON()));
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
  const posts = await Comment.findAll({
    limit: req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
    offset: req.query["offset"] != null ? Number(req.query["offset"]) : undefined,
    where: {
      postId: req.params.postId,
    },
  });

  return res.status(200).type("application/json").send(posts);
});

postRouter.post("/posts", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const post = await Post.create(
    {
      ...req.body,
      userId: req.session.userId,
    },
    {
      include: [
        {
          association: "images",
          through: { attributes: [] },
        },
        { association: "movie" },
        { association: "sound" },
      ],
    },
  );

  return res.status(200).type("application/json").send(post);
});
