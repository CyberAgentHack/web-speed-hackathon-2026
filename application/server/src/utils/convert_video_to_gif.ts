import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export async function convertVideoToGif(videoBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.gif");

  try {
    await fs.writeFile(inputPath, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-i", inputPath,
          "-t", "5",
          "-r", "10",
          "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
          "-an",
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
