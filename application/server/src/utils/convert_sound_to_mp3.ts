import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export async function convertSoundToMp3(audioBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp3");

  try {
    await fs.writeFile(inputPath, audioBuffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-i", inputPath,
          "-vn",
          outputPath,
        ],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
