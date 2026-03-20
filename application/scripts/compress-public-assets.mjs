import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(applicationDir, "public");
const reportsDir = path.resolve(applicationDir, "reports");
const apply = process.argv.includes("--apply");
const emitAvif = process.argv.includes("--emit-avif");
const avifThresholdBytes = 2 * 1024 * 1024;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(entryPath);
      }
      return [entryPath];
    }),
  );
  return nested.flat();
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited with code ${code ?? -1}`));
    });
  });
}

async function convertImage(filePath) {
  const inputBuffer = await fs.readFile(filePath);
  const sourceSize = inputBuffer.byteLength;
  const pipeline = sharp(inputBuffer, { animated: false, limitInputPixels: false }).rotate();
  const sourceMetadata = await pipeline.metadata();
  const webpBuffer = await pipeline
    .webp({
      quality: 86,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();
  const outputMetadata = await sharp(webpBuffer).metadata();
  if (
    outputMetadata.width !== sourceMetadata.width ||
    outputMetadata.height !== sourceMetadata.height
  ) {
    throw new Error(`Image dimensions changed unexpectedly: ${filePath}`);
  }

  let avifBuffer;
  if (emitAvif && sourceSize >= avifThresholdBytes) {
    avifBuffer = await sharp(inputBuffer, { animated: false, limitInputPixels: false })
      .rotate()
      .avif({
        quality: 50,
        effort: 6,
      })
      .toBuffer();
  }

  return {
    afterBytes: webpBuffer.byteLength,
    avifAfterBytes: avifBuffer?.byteLength,
    beforeBytes: sourceSize,
    outputBuffer: webpBuffer,
    outputPath: filePath.replace(/\.(?:jpe?g|png)$/iu, ".webp"),
    avifBuffer,
    avifPath: filePath.replace(/\.(?:jpe?g|png)$/iu, ".avif"),
  };
}

async function convertMovie(filePath) {
  const sourceStats = await fs.stat(filePath);
  const tempPath = filePath.replace(/\.gif$/iu, ".tmp.webm");
  const outputPath = filePath.replace(/\.gif$/iu, ".webm");
  await fs.rm(tempPath, { force: true });
  await runFfmpeg([
    "-y",
    "-i",
    filePath,
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "35",
    "-deadline",
    "good",
    "-row-mt",
    "1",
    tempPath,
  ]);
  const outputStats = await fs.stat(tempPath);

  return {
    afterBytes: outputStats.size,
    beforeBytes: sourceStats.size,
    outputPath,
    tempPath,
  };
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });

  const imageFiles = (await walk(path.resolve(publicDir, "images"))).filter((filePath) =>
    /\.(?:jpe?g|png)$/iu.test(filePath),
  );
  const movieFiles = (await walk(path.resolve(publicDir, "movies"))).filter((filePath) =>
    /\.gif$/iu.test(filePath),
  );

  const results = [];

  for (const imageFile of imageFiles) {
    const result = await convertImage(imageFile);
    results.push({
      kind: "image",
      sourcePath: path.relative(applicationDir, imageFile),
      outputPath: path.relative(applicationDir, result.outputPath),
      beforeBytes: result.beforeBytes,
      afterBytes: result.afterBytes,
      avifOutputPath: emitAvif && result.avifBuffer ? path.relative(applicationDir, result.avifPath) : null,
      avifAfterBytes: result.avifAfterBytes ?? null,
    });

    if (apply) {
      await fs.writeFile(result.outputPath, result.outputBuffer);
      if (emitAvif && result.avifBuffer != null) {
        await fs.writeFile(result.avifPath, result.avifBuffer);
      }
      await fs.rm(imageFile);
    }
  }

  for (const movieFile of movieFiles) {
    const result = await convertMovie(movieFile);
    results.push({
      kind: "movie",
      sourcePath: path.relative(applicationDir, movieFile),
      outputPath: path.relative(applicationDir, result.outputPath),
      beforeBytes: result.beforeBytes,
      afterBytes: result.afterBytes,
    });

    if (apply) {
      await fs.rename(result.tempPath, result.outputPath);
      await fs.rm(movieFile);
    } else {
      await fs.rm(result.tempPath, { force: true });
    }
  }

  const summary = results.reduce(
    (acc, result) => {
      acc.beforeBytes += result.beforeBytes;
      acc.afterBytes += result.afterBytes;
      return acc;
    },
    { afterBytes: 0, beforeBytes: 0 },
  );

  const report = {
    apply,
    emitAvif,
    generatedAt: new Date().toISOString(),
    summary: {
      convertedCount: results.length,
      beforeBytes: summary.beforeBytes,
      afterBytes: summary.afterBytes,
      savedBytes: summary.beforeBytes - summary.afterBytes,
    },
    results: results.sort((left, right) => right.beforeBytes - left.beforeBytes),
  };

  await fs.writeFile(
    path.resolve(reportsDir, "public-asset-compression-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
