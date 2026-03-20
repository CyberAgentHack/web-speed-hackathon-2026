import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.resolve(__dirname, "..");
const publicImageDir = path.resolve(applicationDir, "public/images");
const reportsDir = path.resolve(applicationDir, "reports");
const apply = process.argv.includes("--apply");
const THUMB_QUALITY = 72;
const THUMB_WIDTH = 640;

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

function isTargetImage(filePath) {
  const relativePath = path.relative(publicImageDir, filePath).replaceAll(path.sep, "/");
  return (
    relativePath.startsWith("profiles/") === false &&
    relativePath.endsWith(".thumb.webp") === false &&
    relativePath.endsWith(".webp")
  );
}

async function createThumbnail(filePath) {
  const sourceBuffer = await fs.readFile(filePath);
  const outputBuffer = await sharp(sourceBuffer, { limitInputPixels: false })
    .resize({
      fit: "inside",
      width: THUMB_WIDTH,
      withoutEnlargement: true,
    })
    .webp({
      effort: 4,
      quality: THUMB_QUALITY,
      smartSubsample: true,
    })
    .toBuffer();

  return {
    beforeBytes: sourceBuffer.byteLength,
    outputBuffer,
    outputPath: filePath.replace(/\.webp$/iu, ".thumb.webp"),
  };
}

async function main() {
  const files = (await walk(publicImageDir)).filter(isTargetImage);
  const results = [];

  for (const filePath of files) {
    const result = await createThumbnail(filePath);
    results.push({
      beforeBytes: result.beforeBytes,
      outputPath: path.relative(applicationDir, result.outputPath),
      sourcePath: path.relative(applicationDir, filePath),
      thumbBytes: result.outputBuffer.byteLength,
    });

    if (apply) {
      await fs.writeFile(result.outputPath, result.outputBuffer);
    }
  }

  const summary = results.reduce(
    (accumulator, result) => {
      accumulator.beforeBytes += result.beforeBytes;
      accumulator.thumbBytes += result.thumbBytes;
      return accumulator;
    },
    { beforeBytes: 0, thumbBytes: 0 },
  );

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(
    path.resolve(reportsDir, "image-thumbnail-report.json"),
    JSON.stringify(
      {
        apply,
        generatedAt: new Date().toISOString(),
        summary: {
          beforeBytes: summary.beforeBytes,
          generatedCount: results.length,
          savedBytes: summary.beforeBytes - summary.thumbBytes,
          thumbBytes: summary.thumbBytes,
        },
        results,
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        beforeBytes: summary.beforeBytes,
        generatedCount: results.length,
        savedBytes: summary.beforeBytes - summary.thumbBytes,
        thumbBytes: summary.thumbBytes,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
