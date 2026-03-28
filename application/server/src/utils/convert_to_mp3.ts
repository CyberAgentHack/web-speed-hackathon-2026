import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function convertToMp3(input: Buffer): Promise<Buffer> {
  const tmpIn = path.join(tmpdir(), `${randomUUID()}.input`);
  const tmpOut = path.join(tmpdir(), `${randomUUID()}.mp3`);

  try {
    await fs.writeFile(tmpIn, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tmpIn)
        .noVideo()
        .format("mp3")
        .save(tmpOut)
        .on("end", () => resolve())
        .on("error", reject);
    });

    return fs.readFile(tmpOut);
  } finally {
    await Promise.allSettled([fs.unlink(tmpIn), fs.unlink(tmpOut)]);
  }
}
