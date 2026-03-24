import { promises as fs } from "fs";
import path from "path";

import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { Movie } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// ffmpeg のパスを設定
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// 変換した動画の拡張子
const EXTENSION = "mp4";

// 動画を MP4 に変換（先頭5秒、正方形クロップ、10fps、無音）
async function convertToMp4(input: Buffer): Promise<Buffer> {
  const tmpInputPath = path.join(UPLOAD_PATH, `.tmp-input-${uuidv4()}`);
  const tmpOutputPath = path.join(UPLOAD_PATH, `.tmp-output-${uuidv4()}.mp4`);

  try {
    // 入力ファイルに保存
    await fs.mkdir(UPLOAD_PATH, { recursive: true });
    await fs.writeFile(tmpInputPath, input);

    // ffmpeg で MP4 に変換
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(tmpInputPath)
        .outputOptions(["-t", "5"])
        .outputOptions(["-r", "10"])
        .videoFilter("crop='min(iw,ih)':'min(iw,ih)'")
        .noAudio()
        .save(tmpOutputPath);

      cmd.on("start", (cmdline) => {
        console.log("[convertToMp4] FFmpeg command:", cmdline);
      });

      cmd.on("error", (err) => {
        console.error("[convertToMp4] FFmpeg error:", err.message);
        reject(err);
      });

      cmd.on("end", () => {
        console.log("[convertToMp4] Conversion completed successfully");
        resolve();
      });
    });

    // 出力ファイルをバッファに読み込む
    const mp4Buffer = await fs.readFile(tmpOutputPath);
    return mp4Buffer;
  } finally {
    // 一時ファイルをクリーンアップ
    await fs.unlink(tmpInputPath).catch(() => {});
    await fs.unlink(tmpOutputPath).catch(() => {});
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

  const type = await fileTypeFromBuffer(req.body);
  const ALLOWED_TYPES = ["mp4", "gif", "mkv", "webm", "mov"];
  if (
    type !== undefined &&
    !ALLOWED_TYPES.includes(type.ext) &&
    type.mime !== "video/x-matroska"
  ) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();

  // 動画をサーバー側で MP4 に変換
  const mp4Buffer = await convertToMp4(req.body);

  const filePath = path.resolve(
    UPLOAD_PATH,
    `./movies/${movieId}.${EXTENSION}`,
  );
  await fs.mkdir(path.resolve(UPLOAD_PATH, "movies"), { recursive: true });
  await fs.writeFile(filePath, mp4Buffer);
  await Movie.create({ id: movieId });

  return res.status(200).type("application/json").send({ id: movieId });
});
