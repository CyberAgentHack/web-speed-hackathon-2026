import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import {
    PUBLIC_PATH,
    UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { copyMetadataWithExiftool } from "@web-speed-hackathon-2026/server/src/utils/exiftool";
import { extractAltFromImage } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_image";
import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

// 変換した画像の拡張子
const EXTENSION = "avif";

export const imageRouter = Router();

imageRouter.get("/images/alt", async (req, res) => {
    const src = req.query["src"];
    if (typeof src !== "string") {
        throw new httpErrors.BadRequest("src is required");
    }

    const safeSrc = src.split("?")[0]!.split("#")[0]!;
    if (!safeSrc.startsWith("/images/")) {
        throw new httpErrors.BadRequest("Invalid src");
    }

    const publicRoot = path.resolve(PUBLIC_PATH);
    const imagePath = path.resolve(publicRoot, `.${safeSrc}`);
    if (!(imagePath === publicRoot || imagePath.startsWith(`${publicRoot}/`))) {
        throw new httpErrors.BadRequest("Invalid src");
    }

    const alt = await extractAltFromImage(imagePath);

    return res
        .status(200)
        .type("application/json")
        .send({
            alt: alt ?? "説明はありません",
        });
});

imageRouter.post("/images", async (req, res) => {
    if (req.session.userId === undefined) {
        throw new httpErrors.Unauthorized();
    }
    if (Buffer.isBuffer(req.body) === false) {
        throw new httpErrors.BadRequest();
    }

    const imageId = uuidv4();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "image-upload-"));

    let output: Buffer;

    try {
        const inputPath = path.join(tempDir, "input");
        const outputPath = path.join(tempDir, `output.${EXTENSION}`);

        await fs.writeFile(inputPath, req.body);
        await runFfmpeg([
            "-y",
            "-i",
            inputPath,
            "-frames:v",
            "1",
            "-vf",
            "scale='min(iw,600)':-1",
            "-c:v",
            "libaom-av1",
            "-still-picture",
            "1",
            "-b:v",
            "0",
            outputPath,
        ]);

        await copyMetadataWithExiftool(inputPath, outputPath);

        output = await fs.readFile(outputPath);

        const filePath = path.resolve(
            UPLOAD_PATH,
            `./images/${imageId}.${EXTENSION}`,
        );
        await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), {
            recursive: true,
        });
        await fs.writeFile(filePath, output);
    } catch {
        throw new httpErrors.BadRequest("Invalid file type");
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    return res.status(200).type("application/json").send({ id: imageId });
});
