import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { copyMetadataWithExiftool } from "@web-speed-hackathon-2026/server/src/utils/exiftool";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

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

        const output = await fs.readFile(outputPath);

        const filePath = path.resolve(UPLOAD_PATH, `./movies/${id}.${EXTENSION}`);
        await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
        await fs.writeFile(filePath, req.body);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    return res.status(200).type("application/json").send({ id });
});
