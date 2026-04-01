import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function extractThumbnail(videoInput: string | Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-thumb-"));
  const inputPath = typeof videoInput === "string" ? videoInput : path.join(tmpDir, "input.mp4");
  const outputPath = path.join(tmpDir, "thumbnail.avif");

  try {
    if (Buffer.isBuffer(videoInput)) {
      await fs.writeFile(inputPath, videoInput);
    }
    await execFileAsync("ffmpeg", [
      "-i",
      inputPath,
      "-vframes",
      "1",
      "-vf",
      "crop='min(iw,ih)':'min(iw,ih)'",
      "-q:v",
      "50",
      outputPath,
    ]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
