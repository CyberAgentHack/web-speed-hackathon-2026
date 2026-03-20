import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execFileAsync = promisify(execFile);

const EXTENSION = "mp3";
const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

function decodeBuffer(buf: Buffer): string {
  const utf8 = buf.toString("utf-8");
  if (!utf8.includes("\ufffd")) {
    return utf8;
  }
  const decoder = new TextDecoder("shift_jis");
  return decoder.decode(buf);
}

interface SoundMetadata {
  artist: string;
  title: string;
}

function parseFfmetadata(raw: Buffer): SoundMetadata {
  const text = decodeBuffer(raw);
  const entries = Object.fromEntries(
    text
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim()];
      }),
  );
  return {
    artist: entries["artist"] ?? UNKNOWN_ARTIST,
    title: entries["title"] ?? UNKNOWN_TITLE,
  };
}

async function extractMetadataViaFfmpeg(inputPath: string, tmpDir: string): Promise<SoundMetadata> {
  const metaPath = path.join(tmpDir, "meta.txt");
  try {
    await execFileAsync("ffmpeg", ["-y", "-i", inputPath, "-f", "ffmetadata", metaPath], {
      maxBuffer: 10 * 1024 * 1024,
    });
    const raw = await fs.readFile(metaPath);
    return parseFfmetadata(raw);
  } catch {
    return { artist: UNKNOWN_ARTIST, title: UNKNOWN_TITLE };
  }
}

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const soundId = uuidv4();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, req.body);

    const { artist, title } = await extractMetadataViaFfmpeg(inputPath, tmpDir);

    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-map_metadata",
        "-1",
        "-metadata",
        `artist=${artist}`,
        "-metadata",
        `title=${title}`,
        outputPath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const outputData = await fs.readFile(outputPath);

    await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
    const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
    await fs.writeFile(filePath, outputData);

    return res.status(200).type("application/json").send({ artist, id: soundId, title });
  } catch (err) {
    console.error("[sound upload] ffmpeg error:", err);
    throw new httpErrors.BadRequest("Sound conversion failed");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
