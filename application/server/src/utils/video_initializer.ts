import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import fluentFfmpeg from "fluent-ffmpeg";
import { UPLOAD_PATH, PUBLIC_PATH } from "../paths.js";

if (ffmpegPath) {
  fluentFfmpeg.setFfmpegPath(ffmpegPath);
}

async function convertGifToMp4(inputPath: string, outputPath: string, options: string[]) {
  return new Promise<void>((resolve, reject) => {
    fluentFfmpeg(inputPath)
      .outputOptions(options)
      .toFormat("mp4")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

async function processDirectory(dir: string) {
  const movieDir = path.resolve(dir, "movies");
  try {
    await fs.access(movieDir);
  } catch {
    return; // ディレクトリがなければスキップ
  }

  const files = await fs.readdir(movieDir);
  for (const file of files) {
    if (!file.endsWith(".gif")) continue;

    const id = path.basename(file, ".gif");
    const gifPath = path.join(movieDir, file);
    const mp4Path = path.join(movieDir, `${id}.mp4`);
    const previewPath = path.join(movieDir, `${id}_preview.mp4`);

    // フル解像度 MP4 がない場合に生成（解像度維持・700KB以下ターゲット設定）
    try {
      await fs.access(mp4Path);
    } catch {
      console.log(`Generating full-res ultra-optimized MP4 for ${id}...`);
      await convertGifToMp4(gifPath, mp4Path, [
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-crf 40",
        "-maxrate 800k",
        "-bufsize 1600k",
        "-preset slower",
        "-movflags +faststart"
      ]).catch(err => console.error(`Failed to generate MP4 for ${id}:`, err));
    }


    // プレビュー用 MP4 がない場合に生成
    try {
      await fs.access(previewPath);
    } catch {
      console.log(`Generating missing preview for ${id}...`);
      await convertGifToMp4(gifPath, previewPath, [
        "-t 5",
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-vf scale=256:-2",
        "-crf 32",
        "-preset fast",
        "-movflags +faststart"
      ]).catch(err => console.error(`Failed to generate preview for ${id}:`, err));
    }
  }
}

export async function initializeVideos() {
  console.log("Checking for missing video files...");
  await processDirectory(PUBLIC_PATH);
  await processDirectory(UPLOAD_PATH);
  console.log("Video initialization complete.");
}
