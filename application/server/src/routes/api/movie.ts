import { promises as fs } from "fs";
import path from "path";

import ffmpegPath from "ffmpeg-static";
import fluentFfmpeg from "fluent-ffmpeg";
import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { UPLOAD_PATH, PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// 変換した動画の拡張子
const EXTENSION = "gif";
const VIDEO_EXTENSION = "mp4";

if (ffmpegPath) {
  fluentFfmpeg.setFfmpegPath(ffmpegPath);
}

export const movieRouter = Router();

movieRouter.get("/movies/:id/preview", async (req, res) => {
  const { id } = req.params;
  const previewFileName = `./movies/${id}_preview.${VIDEO_EXTENSION}`;
  const uploadPath = path.resolve(UPLOAD_PATH, previewFileName);
  const publicPath = path.resolve(PUBLIC_PATH, previewFileName);

  try {
    let filePath: string;
    try {
      await fs.access(uploadPath);
      filePath = uploadPath;
    } catch {
      await fs.access(publicPath);
      filePath = publicPath;
    }

    return res.type("video/mp4").sendFile(filePath);
  } catch (error) {
    console.error("Preview fetching failed:", error);
    throw new httpErrors.NotFound();
  }
});

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.ext !== EXTENSION) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const movieDir = path.resolve(UPLOAD_PATH, "movies");

  const tempGifPath = path.resolve(movieDir, `${movieId}.tmp.${EXTENSION}`);
  const mp4Path = path.resolve(movieDir, `${movieId}.${VIDEO_EXTENSION}`);
  const previewMp4Path = path.resolve(movieDir, `${movieId}_preview.${VIDEO_EXTENSION}`);
  const finalGifPath = path.resolve(movieDir, `${movieId}.${EXTENSION}`);

  await fs.mkdir(movieDir, { recursive: true });
  
  // 元の GIF を一旦保存
  await fs.writeFile(tempGifPath, req.body);

  // 変換処理を非同期（await しない）で実行
  (async () => {
    try {
      // 1. フル解像度 MP4 に変換（解像度維持・極限スリム化）
      const convertFull = new Promise<void>((resolve, reject) => {
        fluentFfmpeg(tempGifPath)
          .outputOptions([
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2", // 解像度は維持しつつ偶数化
            "-crf 40",
            "-maxrate 800k",
            "-bufsize 1600k",
            "-preset slower",
            "-movflags +faststart"
          ])
          .toFormat("mp4")
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .save(mp4Path);
      });

      // 2. プレビュー用 MP4 (5秒, 低解像度) に変換
      const convertPreview = new Promise<void>((resolve, reject) => {
        fluentFfmpeg(tempGifPath)
          .outputOptions([
            "-t 5",
            "-c:v libx264",
            "-pix_fmt yuv420p",
            "-vf scale=256:-2",
            "-crf 32",
            "-preset fast",
            "-movflags +faststart"
          ])
          .toFormat("mp4")
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .save(previewMp4Path);
      });

      await Promise.all([convertFull, convertPreview]);
      await fs.rename(tempGifPath, finalGifPath);
      console.log(`Successfully converted movie: ${movieId}`);
    } catch (err) {
      console.error(`Background conversion failed for ${movieId}:`, err);
    }
  })();

  // 変換を待たずにレスポンスを返す
  return res.status(200).type("application/json").send({ id: movieId });
});
