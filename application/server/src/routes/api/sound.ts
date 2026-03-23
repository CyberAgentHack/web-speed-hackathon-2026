import { exec } from "child_process";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";

const execAsync = promisify(exec);

// 変換した音声の拡張子
const EXTENSION = "webm";

async function convertToOpus(inputBuffer: Buffer): Promise<Buffer> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(tmpdir(), `wsh-input-${id}`);
  const outputPath = path.join(tmpdir(), `wsh-output-${id}.webm`);

  await fs.writeFile(inputPath, inputBuffer);

  try {
    // Opus (WebM コンテナ) に変換: ステレオ・96kbps
    await execAsync(`ffmpeg -y -i ${inputPath} -vn -c:a libopus -b:a 96k -ac 2 ${outputPath}`);
    return await fs.readFile(outputPath);
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ]);
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

  const opus = await convertToOpus(req.body);

  const soundId = uuidv4();

  const { artist, title } = await extractMetadataFromSound(opus);

  const filePath = path.resolve(UPLOAD_PATH, `./sounds/${soundId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "sounds"), { recursive: true });
  await fs.writeFile(filePath, opus);

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
