import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * 音声を MP3 に変換し、メタデータ（artist, title）を保持する
 */
export async function convertSoundToMp3(
  input: Buffer,
  metadata: { artist?: string; title?: string },
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp3");

  await fs.writeFile(inputPath, input);

  const cmd = ffmpeg(inputPath).noVideo();

  if (metadata.artist) {
    cmd.outputOptions("-metadata", `artist=${metadata.artist}`);
  }
  if (metadata.title) {
    cmd.outputOptions("-metadata", `title=${metadata.title}`);
  }

  await new Promise<void>((resolve, reject) => {
    cmd
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  const result = await fs.readFile(outputPath);

  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

  return result;
}
