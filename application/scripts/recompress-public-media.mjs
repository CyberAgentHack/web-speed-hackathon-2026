import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(applicationDir, "public");
const reportsDir = path.resolve(applicationDir, "reports");

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const imagesOnly = args.has("--images-only");
const moviesOnly = args.has("--movies-only");

const IMAGE_MIN_SAVED_BYTES = 4 * 1024;
const MOVIE_MIN_SAVED_BYTES = 16 * 1024;

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

function getImageVariant(filePath) {
  const relativePath = path
    .relative(path.resolve(publicDir, "images"), filePath)
    .replaceAll(path.sep, "/");
  if (relativePath.startsWith("profiles/")) {
    return "profile";
  }
  if (relativePath.endsWith(".thumb.webp")) {
    return "thumb";
  }
  return "full";
}

function getImageOptions(variant) {
  if (variant === "thumb") {
    return { effort: 6, quality: 68 };
  }
  if (variant === "profile") {
    return { effort: 6, quality: 78 };
  }
  return { effort: 6, quality: 82, smartSubsample: true };
}

async function recompressImage(filePath) {
  const inputBuffer = await fs.readFile(filePath);
  const variant = getImageVariant(filePath);
  const pipeline = sharp(inputBuffer, { animated: false, limitInputPixels: false }).rotate();
  const metadata = await pipeline.metadata();
  const outputBuffer = await pipeline.webp(getImageOptions(variant)).toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();
  if (metadata.width !== outputMetadata.width || metadata.height !== outputMetadata.height) {
    throw new Error(`Image dimensions changed unexpectedly: ${filePath}`);
  }

  return {
    afterBytes: outputBuffer.byteLength,
    beforeBytes: inputBuffer.byteLength,
    outputBuffer,
    savedBytes: inputBuffer.byteLength - outputBuffer.byteLength,
    variant,
  };
}

function runFfmpeg(argsToRun) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, argsToRun, { stdio: "ignore" });
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

async function recompressMovie(filePath) {
  const inputStats = await fs.stat(filePath);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wsh-recompress-"));
  const outputPath = path.join(tempDir, `${path.basename(filePath, ".webm")}.webm`);

  try {
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
      "37",
      "-deadline",
      "good",
      "-row-mt",
      "1",
      outputPath,
    ]);

    const outputBuffer = await fs.readFile(outputPath);
    return {
      afterBytes: outputBuffer.byteLength,
      beforeBytes: inputStats.size,
      outputBuffer,
      savedBytes: inputStats.size - outputBuffer.byteLength,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });

  const shouldProcessImages = imagesOnly || (imagesOnly === false && moviesOnly === false);
  const shouldProcessMovies = moviesOnly || (imagesOnly === false && moviesOnly === false);

  const imageFiles = shouldProcessImages
    ? (await walk(path.resolve(publicDir, "images"))).filter((filePath) =>
        filePath.endsWith(".webp"),
      )
    : [];
  const movieFiles = shouldProcessMovies
    ? (await walk(path.resolve(publicDir, "movies"))).filter((filePath) =>
        filePath.endsWith(".webm"),
      )
    : [];

  const results = [];

  if (shouldProcessImages) {
    for (const imageFile of imageFiles) {
      const result = await recompressImage(imageFile);
      const kept = result.savedBytes >= IMAGE_MIN_SAVED_BYTES;
      results.push({
        kind: "image",
        sourcePath: path.relative(applicationDir, imageFile),
        beforeBytes: result.beforeBytes,
        afterBytes: result.afterBytes,
        savedBytes: result.savedBytes,
        variant: result.variant,
        kept,
      });

      if (apply && kept) {
        await fs.writeFile(imageFile, result.outputBuffer);
      }
    }
  }

  if (shouldProcessMovies) {
    for (const movieFile of movieFiles) {
      const result = await recompressMovie(movieFile);
      const kept = result.savedBytes >= MOVIE_MIN_SAVED_BYTES;
      results.push({
        kind: "movie",
        sourcePath: path.relative(applicationDir, movieFile),
        beforeBytes: result.beforeBytes,
        afterBytes: result.afterBytes,
        savedBytes: result.savedBytes,
        kept,
      });

      if (apply && kept) {
        await fs.writeFile(movieFile, result.outputBuffer);
      }
    }
  }

  const summary = results.reduce(
    (accumulator, result) => {
      accumulator.checkedCount += 1;
      if (result.kept) {
        accumulator.keptCount += 1;
        accumulator.beforeBytes += result.beforeBytes;
        accumulator.afterBytes += result.afterBytes;
        accumulator.savedBytes += result.savedBytes;
      }
      return accumulator;
    },
    { afterBytes: 0, beforeBytes: 0, checkedCount: 0, keptCount: 0, savedBytes: 0 },
  );

  const report = {
    apply,
    generatedAt: new Date().toISOString(),
    summary,
    thresholds: {
      imageMinSavedBytes: IMAGE_MIN_SAVED_BYTES,
      movieMinSavedBytes: MOVIE_MIN_SAVED_BYTES,
    },
    results: results.sort((left, right) => right.savedBytes - left.savedBytes),
  };

  await fs.writeFile(
    path.resolve(reportsDir, "public-media-recompression-report.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
