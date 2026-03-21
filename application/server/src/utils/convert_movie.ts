import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function convertMovie(input: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${uuidv4()}.mkv`);
  const outputPath = path.join(tmpDir, `${uuidv4()}.gif`);

  try {
    await fs.writeFile(inputPath, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-t", "5",
          "-r", "10",
          "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
          "-an",
          "-threads", "1",
        ])
        .toFormat("gif")
        .on("error", reject)
        .on("end", () => resolve())
        .save(outputPath);
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
