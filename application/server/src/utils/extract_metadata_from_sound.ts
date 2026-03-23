import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import * as MusicMetadata from "music-metadata";
import Encoding from "encoding-japanese";
import ffmpegStatic from "ffmpeg-static";

const execAsync = promisify(exec);

interface SoundMetadata {
  artist?: string;
  title?: string;
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  const soundId = uuidv4();
  const tempInputPath = path.join(os.tmpdir(), `${soundId}_meta_input`);
  const tempMetaPath = path.join(os.tmpdir(), `${soundId}_meta.txt`);

  try {
    // Write buffer to temp file
    await fs.writeFile(tempInputPath, data);

    // Extract metadata using ffmpeg to a text file
    // -f ffmetadata ensures we get the raw metadata in a predictable format
    const ffmpegPath = ffmpegStatic || "ffmpeg";
    await execAsync(`"${ffmpegPath}" -i "${tempInputPath}" -f ffmetadata "${tempMetaPath}" -y`);

    // Read the metadata file as a buffer to handle encoding
    const metaBuffer = await fs.readFile(tempMetaPath);

    // Convert encoding (Shift-JIS/EUC-JP to UTF-8)
    const metaText = Encoding.convert(metaBuffer, {
      to: "UNICODE",
      from: "AUTO",
      type: "string",
    });

    const meta = parseFFmetadata(metaText);

    return {
      artist: meta["artist"] || undefined,
      title: meta["title"] || undefined,
    };
  } catch (error) {
    console.error("Metadata extraction via ffmpeg failed, falling back to music-metadata:", error);
    try {
      const metadata = await MusicMetadata.parseBuffer(data);
      return {
        artist: metadata.common.artist,
        title: metadata.common.title,
      };
    } catch {
      return {
        artist: undefined,
        title: undefined,
      };
    }
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(tempInputPath);
      await fs.unlink(tempMetaPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function parseFFmetadata(ffmetadata: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = ffmetadata.split("\n");
  for (const line of lines) {
    if (line.startsWith(";") || !line.includes("=")) continue;
    const [key, ...valueParts] = line.split("=");
    if (key) {
      result[key.trim().toLowerCase()] = valueParts.join("=").trim();
    }
  }
  return result;
}
