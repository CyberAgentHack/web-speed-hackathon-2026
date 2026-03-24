const { promises: fs } = require("fs");
const path = require("path");
const { Readable } = require("stream");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffmpeg = require("fluent-ffmpeg");

// ffmpeg のパスを設定
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// MP3 → Opus に変換
async function convertToOpus(input) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    ffmpeg(Readable.from(input))
      .audioCodec("libopus")
      .audioBitrate("64k")
      .format("opus")
      .on("error", reject)
      .on("end", () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on("data", (chunk) => chunks.push(chunk));
  });
}

async function migrate() {
  const soundsDir = path.resolve(__dirname, "application/public/sounds");

  try {
    const files = await fs.readdir(soundsDir);
    const mp3Files = files.filter((f) => f.endsWith(".mp3"));

    console.log(`Found ${mp3Files.length} MP3 files to migrate`);

    let converted = 0;
    let sizeSaved = 0;

    for (const file of mp3Files) {
      const mp3Path = path.resolve(soundsDir, file);
      const opusPath = path.resolve(soundsDir, file.replace(".mp3", ".opus"));

      try {
        console.log(`Converting: ${file}`);
        const mp3Buffer = await fs.readFile(mp3Path);
        const originalSize = mp3Buffer.length;

        const opusBuffer = await convertToOpus(mp3Buffer);
        const newSize = opusBuffer.length;

        await fs.writeFile(opusPath, opusBuffer);
        await fs.unlink(mp3Path);

        const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
        console.log(
          `✓ ${file}: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`
        );

        converted++;
        sizeSaved += originalSize - newSize;
      } catch (err) {
        console.error(`✗ Error converting ${file}:`, err.message);
      }
    }

    console.log("\nMigration complete!");
    console.log(`  Total converted: ${converted} files`);
    console.log(`  Total size saved: ${(sizeSaved / 1024 / 1024).toFixed(2)}MB`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
