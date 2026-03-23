import fs, { stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import {
    PUBLIC_PATH,
    UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import {
    copyMetadataWithExiftool,
    getImageDimensions,
} from "@web-speed-hackathon-2026/server/src/utils/exiftool";
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
    const normalizedSrc = safeSrc.startsWith("/upload/")
        ? safeSrc.slice("/upload".length)
        : safeSrc;
    if (!normalizedSrc.startsWith("/images/")) {
        throw new httpErrors.BadRequest("Invalid src");
    }

    const publicRoot = path.resolve(PUBLIC_PATH);
    const uploadRoot = path.resolve(UPLOAD_PATH);

    const candidateEntries = [
        {
            root: publicRoot,
            absolutePath: path.resolve(publicRoot, `.${safeSrc}`),
        },
        {
            root: publicRoot,
            absolutePath: path.resolve(publicRoot, `.${normalizedSrc}`),
        },
        {
            root: uploadRoot,
            absolutePath: path.resolve(uploadRoot, `.${normalizedSrc}`),
        },
    ];

    const candidates = candidateEntries.filter(
        (entry, index, self) =>
            self.findIndex(
                (value) => value.absolutePath === entry.absolutePath,
            ) === index,
    );

    const isInRoot = (targetPath: string, rootPath: string) =>
        targetPath === rootPath || targetPath.startsWith(`${rootPath}/`);

    for (const { root, absolutePath } of candidates) {
        if (!isInRoot(absolutePath, root)) {
            throw new httpErrors.BadRequest("Invalid src");
        }
    }

    let imagePath: string | null = null;
    for (const { absolutePath } of candidates) {
        try {
            const fileStats = await stat(absolutePath);
            if (fileStats.isFile()) {
                imagePath = absolutePath;
                break;
            }
        } catch {
            continue;
        }
    }

    if (imagePath === null) {
        throw new httpErrors.NotFound("Image not found");
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

    const filePath = path.resolve(
        UPLOAD_PATH,
        `./images/${imageId}.${EXTENSION}`,
    );

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

        await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), {
            recursive: true,
        });
        await fs.writeFile(filePath, output);
    } catch {
        throw new httpErrors.BadRequest("Invalid file type");
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    let sizeBytes: number | null = null;
    let width: number | null = null;
    let height: number | null = null;
    try {
        const [fileStats, dimensions] = await Promise.all([
            stat(filePath),
            getImageDimensions(filePath),
        ]);
        sizeBytes = fileStats.size;
        width = dimensions.width;
        height = dimensions.height;
    } catch (err) {
        console.warn(`Failed to get metadata for image ${imageId}`, err);
    }

    // Save image metadata to database
    try {
        await Image.create({
            id: imageId,
            alt: "",
            width,
            height,
            sizeBytes,
        });
    } catch (err) {
        console.error("Failed to save image metadata to database", err);
        // Continue even if database save fails
    }
    return res.status(200).type("application/json").send({ id: imageId });
});
