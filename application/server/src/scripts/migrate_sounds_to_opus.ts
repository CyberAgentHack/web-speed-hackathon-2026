import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

// ffmpeg のパスを設定
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// MP3 → Opus に変換
async function convertToOpus(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    ffmpeg(Readable.from(input))
      .audioCodec("libopus")
      .audioBitrate("64k")
      .format("opus")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on("data", (chunk: Buffer) => chunks.push(chunk));
  });
}

async function migrate() {
  const soundsDir = path.resolve(UPLOAD_PATH, "sounds");

  try {
    const files = await fs.readdir(soundsDir);
    const mp3Files = files.filter((f) => f.endsWith(".mp3"));

    console.log(`Found ${mp3Files.length} MP3 files to migrate`);

    for (const file of mp3Files) {
      const mp3Path = path.resolve(soundsDir, file);
      const opusPath = path.resolve(soundsDir, file.replace(".mp3", ".opus"));

      try {
        console.log(`Converting: ${file}`);
        const mp3Buffer = await fs.readFile(mp3Path);
        const opusBuffer = await convertToOpus(mp3Buffer);
        await fs.writeFile(opusPath, opusBuffer);
        await fs.unlink(mp3Path);
        console.log(`✓ Converted: ${file}`);
      } catch (err) {
        console.error(`✗ Error converting ${file}:`, err);
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
