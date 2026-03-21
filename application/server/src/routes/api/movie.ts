import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { copyMetadataWithExiftool } from "@web-speed-hackathon-2026/server/src/utils/exiftool";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";
import {
    createMovieThumbnail,
    MOVIE_THUMBNAIL_EXTENSION,
} from "@web-speed-hackathon-2026/server/src/utils/movie_thumbnail";

// 変換した動画の拡張子
const EXTENSION = "webm";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
    if (req.session.userId === undefined) {
        throw new httpErrors.Unauthorized();
    }
    if (Buffer.isBuffer(req.body) === false) {
        throw new httpErrors.BadRequest();
    }

    const id = uuidv4();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-upload-"));

    try {
        const inputPath = path.join(tempDir, "input");
        const outputPath = path.join(tempDir, `output.${EXTENSION}`);
        const outputThumbnailPath = path.join(
            tempDir,
            `thumbnail.${MOVIE_THUMBNAIL_EXTENSION}`,
        );

        await fs.writeFile(inputPath, req.body);

        await runFfmpeg([
            "-y",
            "-i",
            inputPath,
            "-movflags",
            "faststart",
            "-vf",
            "scale='min(iw,600)':-1",
            "-pix_fmt",
            "yuv420p",
            "-row-mt",
            "1",
            outputPath,
        ]);

        await copyMetadataWithExiftool(inputPath, outputPath);

        await createMovieThumbnail(outputPath, outputThumbnailPath);

        const output = await fs.readFile(outputPath);
        const thumbnail = await fs.readFile(outputThumbnailPath);

        const moviesDir = path.resolve(UPLOAD_PATH, "movies");
        const thumbnailsDir = path.resolve(moviesDir, "thumbnails");
        const moviePath = path.resolve(moviesDir, `${id}.${EXTENSION}`);
        const thumbnailPath = path.resolve(
            thumbnailsDir,
            `${id}.${MOVIE_THUMBNAIL_EXTENSION}`,
        );

        await fs.mkdir(moviesDir, { recursive: true });
        await fs.mkdir(thumbnailsDir, { recursive: true });
        await fs.writeFile(moviePath, output);
        await fs.writeFile(thumbnailPath, thumbnail);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    return res.status(200).type("application/json").send({ id });
});
