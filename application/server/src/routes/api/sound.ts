import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import httpErrors from "http-errors";
import { OfflineAudioContext } from "node-web-audio-api";
import { v4 as uuidv4 } from "uuid";

import { Sound } from "@web-speed-hackathon-2026/server/src/models";
import { copyMetadataWithExiftool } from "@web-speed-hackathon-2026/server/src/utils/exiftool";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した音声の拡張子
const EXTENSION = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
    if (req.session.userId === undefined) {
        throw new httpErrors.Unauthorized();
    }
    if (Buffer.isBuffer(req.body) === false) {
        throw new httpErrors.BadRequest();
    }

    const soundId = uuidv4();

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-upload-"));

    let output: Buffer;
    let artist: string;
    let title: string;

    try {
        const inputPath = path.join(tempDir, "input");
        const outputPath = path.join(tempDir, `output.${EXTENSION}`);

        await fs.writeFile(inputPath, req.body);

        const metadata = await extractMetadataFromSound(req.body);
        artist = metadata.artist ?? "Unknown";
        title = metadata.title ?? "Unknown";

        await runFfmpeg([
            "-y",
            "-i",
            inputPath,
            "-metadata",
            `artist=${artist}`,
            "-metadata",
            `title=${title}`,
            "-vn",
            outputPath,
        ]);

        await copyMetadataWithExiftool(inputPath, outputPath);

        output = await fs.readFile(outputPath);
    } catch {
        throw new httpErrors.BadRequest("Invalid file type");
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    const audioCtx = new OfflineAudioContext(1, 1, 44100);
    const buffer = await audioCtx.decodeAudioData(
        (output.buffer as ArrayBuffer).slice(
            output.byteOffset,
            output.byteOffset + output.byteLength,
        ),
    );

    const leftChannel = buffer.getChannelData(0);
    const rightChannel =
        buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : leftChannel;

    const length = buffer.length;
    const numChunks = 100;
    const chunkSize = length / numChunks;
    const peaks: number[] = [];

    for (let i = 0; i < numChunks; i++) {
        const start = Math.floor(i * chunkSize);
        const end = Math.floor((i + 1) * chunkSize);

        let sum = 0;
        for (let j = start; j < end; j++) {
            const leftAbs = Math.abs(leftChannel[j] ?? 0);
            const rightAbs = Math.abs(rightChannel[j] ?? 0);
            sum += (leftAbs + rightAbs) / 2;
        }
        const count = end - start;
        peaks.push(count > 0 ? sum / count : 0);
    }

    const filePath = path.resolve(
        UPLOAD_PATH,
        `./sounds/${soundId}.${EXTENSION}`,
    );
    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    await fs.writeFile(filePath, req.body);

    await Sound.create({
        id: soundId,
        artist,
        peaks,
        title,
    });

    return res.status(200).type("application/json").send({ id: soundId });
});
