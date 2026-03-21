import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export async function convertVideoToMp4(videoBuffer: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    await fs.writeFile(inputPath, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-i", inputPath,
          "-t", "5",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-crf", "23",
          "-preset", "fast",
          "-vf", "crop='min(iw,ih)':'min(iw,ih)',scale=540:540",
          "-movflags", "+faststart",
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
