import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function convertToMp4(input: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp4");

  await fs.writeFile(inputPath, input);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-t", "5",
        "-r", "10",
        "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
        "-an",
        "-movflags", "frag_keyframe+empty_moov",
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const result = await fs.readFile(outputPath);

  // Cleanup
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  return result;
}
