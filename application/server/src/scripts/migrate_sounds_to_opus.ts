import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";

import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const UPLOAD_PATH = path.resolve(import.meta.dirname, "../../../upload");
const SOUNDS_DIR = path.resolve(UPLOAD_PATH, "sounds");

function convertToOpus(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    ffmpeg(Readable.from(input))
      .audioCodec("libopus")
      .audioBitrate("64k")
      .format("opus")
      .on("error", reject)
      .pipe()
      .on("data", (chunk: Buffer) => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function main() {
  let files: string[];
  try {
    files = await fs.readdir(SOUNDS_DIR);
  } catch {
    console.log("No sounds directory found, nothing to migrate.");
    return;
  }

  const oggFiles = files.filter((f) => f.endsWith(".ogg"));
  if (oggFiles.length === 0) {
    console.log("No .ogg files to migrate.");
    return;
  }

  console.log(`Found ${oggFiles.length} .ogg file(s) to convert to .opus`);

  for (const file of oggFiles) {
    const inputPath = path.resolve(SOUNDS_DIR, file);
    const outputPath = path.resolve(SOUNDS_DIR, file.replace(/\.ogg$/, ".opus"));

    console.log(`Converting ${file}...`);
    const input = await fs.readFile(inputPath);
    const opus = await convertToOpus(input);
    await fs.writeFile(outputPath, opus);
    await fs.unlink(inputPath);
    console.log(`  -> ${file.replace(/\.ogg$/, ".opus")}`);
  }

  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
