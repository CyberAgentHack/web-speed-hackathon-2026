import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export async function runFFmpeg(input: Buffer, args: string[], outputExtension: string): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, `output.${outputExtension}`);

  try {
    await fs.writeFile(inputPath, input);
    await execFileAsync(ffmpegPath!, ["-y", "-i", inputPath, ...args, outputPath]);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
