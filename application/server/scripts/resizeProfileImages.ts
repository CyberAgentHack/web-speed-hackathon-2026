import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const PROFILE_IMAGE_SIZE = 126;
const WEBP_QUALITY = 82;

interface ResizeResult {
  action: "resized" | "skipped";
  filePath: string;
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

async function resizeProfileImage(
  filePath: string,
  dryRun: boolean,
): Promise<ResizeResult> {
  const originalBuffer = await fs.readFile(filePath);
  const originalSize = originalBuffer.byteLength;
  const metadata = await sharp(originalBuffer, { failOn: "warning" }).metadata();

  if (typeof metadata.width !== "number" || typeof metadata.height !== "number") {
    throw new Error("Image dimensions are missing from metadata");
  }

  // If already 126x126 or smaller, skip
  if (metadata.width <= PROFILE_IMAGE_SIZE && metadata.height <= PROFILE_IMAGE_SIZE) {
    return {
      action: "skipped",
      filePath,
      originalSize,
      outputSize: originalSize,
    };
  }

  const outputBuffer = await sharp(originalBuffer, { failOn: "warning" })
    .resize(PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE, {
      fit: "cover",
      position: "center",
    })
    .webp({
      effort: 6,
      quality: WEBP_QUALITY,
    })
    .toBuffer();

  const outputSize = outputBuffer.byteLength;

  if (!dryRun) {
    await fs.writeFile(filePath, outputBuffer);
  }

  return {
    action: "resized",
    filePath,
    originalSize,
    outputSize,
  };
}

const isDryRun = process.argv.includes("--dry-run");
const scriptDirPath = path.dirname(fileURLToPath(import.meta.url));
const profileImagesDirPath = path.resolve(scriptDirPath, "../../public/images/profiles");

const dirents = await fs.readdir(profileImagesDirPath, { withFileTypes: true });
const webpFiles = dirents
  .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".webp"))
  .map((dirent) => path.join(profileImagesDirPath, dirent.name))
  .sort();

let resizedCount = 0;
let skippedCount = 0;
let totalBytesBefore = 0;
let totalBytesAfter = 0;

for (const filePath of webpFiles) {
  const relativePath = path.relative(profileImagesDirPath, filePath);

  try {
    const result = await resizeProfileImage(filePath, isDryRun);
    totalBytesBefore += result.originalSize;
    totalBytesAfter += result.outputSize;

    if (result.action === "skipped") {
      skippedCount += 1;
      console.log(`SKIP ${relativePath} (${formatBytes(result.originalSize)})`);
      continue;
    }

    resizedCount += 1;
    console.log(
      [
        isDryRun ? "DRY " : "DONE",
        relativePath,
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
  `Processed ${webpFiles.length} files: resized=${resizedCount}, skipped=${skippedCount}`,
);
console.log(
  `Total size ${formatBytes(totalBytesBefore)} -> ${formatBytes(totalBytesAfter)} (${formatBytes(totalBytesBefore - totalBytesAfter)} saved)`,
);
