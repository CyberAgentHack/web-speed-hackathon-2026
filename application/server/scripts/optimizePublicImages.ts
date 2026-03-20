import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isOptimizableImageExtension,
  OPTIMIZED_IMAGE_EXTENSION,
  OPTIMIZED_IMAGE_MAX_WIDTH,
  optimizeImageToWebp,
  readImageMetadata,
} from "@web-speed-hackathon-2026/server/src/utils/optimize_image";

interface OptimizationResult {
  action: "optimized" | "skipped";
  convertedToWebp: boolean;
  nextPath: string;
  originalSize: number;
  outputSize: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

async function collectImagePaths(dirPath: string): Promise<string[]> {
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });
  const imagePaths = await Promise.all(
    dirents.map(async (dirent) => {
      const entryPath = path.join(dirPath, dirent.name);

      if (dirent.isDirectory()) {
        return collectImagePaths(entryPath);
      }

      if (!dirent.isFile()) {
        return [];
      }

      const extension = path.extname(dirent.name).toLowerCase();
      return isOptimizableImageExtension(extension) ? [entryPath] : [];
    }),
  );

  return imagePaths.flat().sort((left, right) => left.localeCompare(right));
}

async function optimizeImage(
  filePath: string,
  dryRun: boolean,
): Promise<OptimizationResult> {
  const originalExtension = path.extname(filePath).toLowerCase();
  const originalBuffer = await fs.readFile(filePath);
  const originalSize = originalBuffer.byteLength;
  const metadata = await readImageMetadata(originalBuffer);

  if (typeof metadata.width !== "number") {
    throw new Error("Image width is missing from metadata");
  }

  const requiresResize = metadata.width > OPTIMIZED_IMAGE_MAX_WIDTH;
  const outputBuffer = await optimizeImageToWebp(originalBuffer);
  const outputSize = outputBuffer.byteLength;
  const requiresExtensionChange = originalExtension !== `.${OPTIMIZED_IMAGE_EXTENSION}`;

  if (!requiresResize && !requiresExtensionChange && outputSize >= originalSize) {
    return {
      action: "skipped",
      convertedToWebp: false,
      nextPath: filePath,
      originalSize,
      outputSize: originalSize,
    };
  }

  const nextPath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath, originalExtension)}.${OPTIMIZED_IMAGE_EXTENSION}`,
  );

  if (!dryRun) {
    await fs.writeFile(nextPath, outputBuffer);
    if (nextPath !== filePath) {
      await fs.rm(filePath, { force: true });
    }
  }

  return {
    action: "optimized",
    convertedToWebp: requiresExtensionChange,
    nextPath,
    originalSize,
    outputSize,
  };
}

const isDryRun = process.argv.includes("--dry-run");
const scriptDirPath = path.dirname(fileURLToPath(import.meta.url));
const publicImagesDirPath = path.resolve(scriptDirPath, "../../public/images");
const imagePaths = await collectImagePaths(publicImagesDirPath);

let optimizedCount = 0;
let skippedCount = 0;
let convertedToWebpCount = 0;
let totalBytesBefore = 0;
let totalBytesAfter = 0;

for (const imagePath of imagePaths) {
  const relativePath = path.relative(publicImagesDirPath, imagePath);

  try {
    const result = await optimizeImage(imagePath, isDryRun);
    totalBytesBefore += result.originalSize;
    totalBytesAfter += result.outputSize;

    if (result.action === "skipped") {
      skippedCount += 1;
      console.log(`SKIP ${relativePath} (${formatBytes(result.originalSize)})`);
      continue;
    }

    optimizedCount += 1;
    if (result.convertedToWebp) {
      convertedToWebpCount += 1;
    }

    const nextRelativePath = path.relative(publicImagesDirPath, result.nextPath);
    console.log(
      [
        isDryRun ? "DRY " : "DONE",
        relativePath,
        "->",
        nextRelativePath,
        `(${formatBytes(result.originalSize)} -> ${formatBytes(result.outputSize)})`,
      ].join(" "),
    );
  } catch (error) {
    console.error(`FAIL ${relativePath}`, error);
    process.exitCode = 1;
  }
}

console.log("");
console.log(
  `Processed ${imagePaths.length} files: optimized=${optimizedCount}, skipped=${skippedCount}, webp=${convertedToWebpCount}`,
);
console.log(
  `Total size ${formatBytes(totalBytesBefore)} -> ${formatBytes(totalBytesAfter)} (${formatBytes(totalBytesBefore - totalBytesAfter)} saved)`,
);
