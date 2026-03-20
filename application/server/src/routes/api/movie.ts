import { exec } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const execAsync = promisify(exec);

// 変換した動画の拡張子
const EXTENSION = "gif";

async function convertToGif(inputBuffer: Buffer): Promise<Buffer> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(tmpdir(), `wsh-input-${id}`);
  const outputPath = path.join(tmpdir(), `wsh-output-${id}.gif`);

  await fs.writeFile(inputPath, inputBuffer);

  try {
    await execAsync(
      `ffmpeg -y -i ${inputPath} -t 5 -r 10 -vf "crop='min(iw,ih)':'min(iw,ih)'" -an ${outputPath}`,
    );
    return await fs.readFile(outputPath);
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ]);
  }
}

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const gif = await convertToGif(req.body);

  const movieId = uuidv4();

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, gif);

  return res.status(200).type("application/json").send({ id: movieId });
});
