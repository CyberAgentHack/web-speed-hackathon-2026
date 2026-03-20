import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import Encoding from "encoding-japanese";

const execFileAsync = promisify(execFile);

interface SoundMetadata {
  artist?: string;
  title?: string;
  [key: string]: string | undefined;
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-meta-"));
  const inputPath = path.join(tmpDir, "input");
  const outputPath = path.join(tmpDir, "meta.txt");

  try {
    await fs.writeFile(inputPath, data);
    await execFileAsync("ffmpeg", ["-i", inputPath, "-f", "ffmetadata", outputPath]);

    const raw = await fs.readFile(outputPath);

    const outputUtf8 = Encoding.convert(raw, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });

    const meta = parseFFmetadata(outputUtf8);

    return {
      artist: meta.artist ?? UNKNOWN_ARTIST,
      title: meta.title ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

function parseFFmetadata(ffmetadata: string): Partial<SoundMetadata> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => line.split("="))
      .map(([key, value]) => [key!.trim(), value!.trim()]),
  ) as Partial<SoundMetadata>;
}
