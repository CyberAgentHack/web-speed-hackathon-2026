import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

interface ConvertSoundOptions {
  artist?: string;
  title?: string;
}

export async function convertSound(input: Buffer, options: ConvertSoundOptions): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-sound-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "output.mp3");

  try {
    await fs.writeFile(inputPath, input);

    const args = ["-i", inputPath];

    if (options.artist) {
      args.push("-metadata", `artist=${options.artist}`);
    }
    if (options.title) {
      args.push("-metadata", `title=${options.title}`);
    }

    args.push("-vn", outputPath);

    await execFileAsync("ffmpeg", args);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
