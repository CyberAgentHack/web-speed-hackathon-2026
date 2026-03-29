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

/** 変換した動画の拡張子 */
const EXTENSION = "mp4";

/**
 * サーバーサイドでffmpegを使い動画を変換する。
 * クライアントのFFmpeg WASM変換（120秒タイムアウト超過の原因）を不要にする。
 * 変換内容: 先頭5秒・正方形クロップ・10fps・無音・MP4
 */
async function convertMovie(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, `output.${EXTENSION}`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    // ffmpeg-staticは投稿時のみ使用するため、サーバー起動時間短縮のためdynamic importする
    const ffmpegPath = (await import("ffmpeg-static")).default;
    await execFileAsync(ffmpegPath!, [
      "-i", inputPath,
      "-t", "5",
      "-r", "10",
      "-vf", "crop=min(iw\\,ih):min(iw\\,ih)",
      "-an",
      "-y",
      outputPath,
    ], { timeout: 30_000 });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
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

  // ffmpegが対応する任意の動画フォーマットを受け付ける（MKV等も含む）
  // ファイルタイプ判定はffmpegに委ね、変換失敗時にエラーを返す

  const movieId = uuidv4();

  const converted = await convertMovie(req.body);

  const filePath = path.resolve(UPLOAD_PATH, `./movies/${movieId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, converted);

  return res.status(200).type("application/json").send({ id: movieId });
});
