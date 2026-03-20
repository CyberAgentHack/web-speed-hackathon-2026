import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function convertToGif(input: Buffer): Promise<Buffer> {
  const tmpIn = path.join(tmpdir(), `${randomUUID()}.input`);
  const tmpOut = path.join(tmpdir(), `${randomUUID()}.gif`);

  try {
    await fs.writeFile(tmpIn, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .duration(5)
        .fps(10)
        .videoFilter("crop='min(iw,ih)':'min(iw,ih)'")
        .noAudio()
        .format("gif")
        .save(tmpOut)
        .on("end", () => resolve())
        .on("error", reject);
    });

    return fs.readFile(tmpOut);
  } finally {
    await Promise.allSettled([fs.unlink(tmpIn), fs.unlink(tmpOut)]);
  }
}
