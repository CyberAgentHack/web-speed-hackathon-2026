import { Router } from "express";
import httpErrors from "http-errors";

import {
    Comment,
    Post,
    PostsImagesRelation,
} from "@web-speed-hackathon-2026/server/src/models";

export const postRouter = Router();

postRouter.get("/posts", async (req, res) => {
    const posts = await Post.findAll({
        limit:
            req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
        offset:
            req.query["offset"] != null
                ? Number(req.query["offset"])
                : undefined,
    });

    return res.status(200).type("application/json").send(posts);
});

postRouter.get("/posts/:postId", async (req, res) => {
    const post = await Post.findByPk(req.params.postId);

    if (post === null) {
        throw new httpErrors.NotFound();
    }

    return res.status(200).type("application/json").send(post);
});

postRouter.get("/posts/:postId/comments", async (req, res) => {
    const posts = await Comment.findAll({
        limit:
            req.query["limit"] != null ? Number(req.query["limit"]) : undefined,
        offset:
            req.query["offset"] != null
                ? Number(req.query["offset"])
                : undefined,
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

    const postData = { ...req.body };
    const images = postData.images;
    const movie = postData.movie;
    const sound = postData.sound;
    delete postData.images;
    delete postData.movie;
    delete postData.sound;

    const post = await Post.create({
        ...postData,
        userId: req.session.userId,
        movieId: movie?.id,
        soundId: sound?.id,
    });

    if (images && Array.isArray(images) && images.length > 0) {
        await PostsImagesRelation.bulkCreate(
            images.map((img: any) => ({
                postId: post.id,
                imageId: img.id,
            })),
        );
    }

    // Fetch the post again to load standard includes to send back a complete object
    const createdPost = await Post.findByPk(post.id, {
        include: [
            {
                association: "images",
                through: { attributes: [] },
            },
            { association: "movie" },
            { association: "sound" },
        ],
    });

    return res.status(200).type("application/json").send(createdPost);
});
