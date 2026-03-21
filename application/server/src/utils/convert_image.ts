import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function convertImageToJpeg(input: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `${uuidv4()}.bin`);
  const outputPath = path.join(tmpDir, `${uuidv4()}.jpg`);

  try {
    await fs.writeFile(inputPath, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-q:v", "2", "-threads", "1"])
        .toFormat("mjpeg")
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
