import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * 動画を WebM (VP8) に変換する（先頭5秒、正方形クロップ、10fps、無音、960px以下にリサイズ）
 */
export async function convertMovieToWebm(input: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.webm");

  await fs.writeFile(inputPath, input);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .duration(5)
      .fps(10)
      .videoFilter("crop='min(iw,ih)':'min(iw,ih)',scale='min(960,iw)':'min(960,ih)'")
      .noAudio()
      .outputOptions([
        "-c:v",
        "libvpx",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "40",
        "-b:v",
        "1M",
        "-cpu-used",
        "8",
        "-deadline",
        "realtime",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const result = await fs.readFile(outputPath);

  // cleanup
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  return result;
}
