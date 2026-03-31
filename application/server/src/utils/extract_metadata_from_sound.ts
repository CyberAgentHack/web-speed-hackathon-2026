import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface SoundMetadata {
  artist?: string;
  title?: string;
}

async function withTempDir<T>(fn: (dirPath: string) => Promise<T>): Promise<T> {
  const dirPath = await fs.mkdtemp(path.join(tmpdir(), "cax-meta-"));
  try {
    return await fn(dirPath);
  } finally {
    await fs.rm(dirPath, { force: true, recursive: true });
  }
}

// WAVのRIFF INFOチャンクはShift-JIS（Windows由来）のことがある。
// UTF-8として不正なバイト列であれば Shift-JIS にフォールバックする。
function decodeWithFallback(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("shift_jis").decode(bytes);
  }
}

function parseFFmetadata(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    if (line.startsWith(";") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  }
  return result;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    return await withTempDir(async (dirPath) => {
      const inputPath = path.join(dirPath, "input");
      const metaPath = path.join(dirPath, "meta.txt");

      await fs.writeFile(inputPath, data);

      // ffmpegでffmetadata形式としてメタデータをファイルに書き出す
      await execFileAsync("ffmpeg", ["-y", "-i", inputPath, "-f", "ffmetadata", metaPath]);

      const rawBytes = await fs.readFile(metaPath);
      const text = decodeWithFallback(rawBytes);
      const meta = parseFFmetadata(text);

      return {
        artist: meta["artist"] || undefined,
        title: meta["title"] || undefined,
      };
    });
  } catch {
    return { artist: undefined, title: undefined };
  }
}
