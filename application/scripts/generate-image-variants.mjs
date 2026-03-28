import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const TARGET_DIRS = [
  path.resolve(ROOT_DIR, "public/images"),
  path.resolve(ROOT_DIR, "public/images/profiles"),
];

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const VARIANTS = [
  {
    suffix: "_thumb",
    width: 400,
    quality: 70,
  },
  {
    suffix: "_medium",
    width: 1200,
    quality: 80,
  },
];

function isVariantFile(fileName) {
  return fileName.includes("_thumb.") || fileName.includes("_medium.");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function generateVariants(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return;
  }

  const baseName = path.basename(filePath, ext);
  if (isVariantFile(baseName + ext)) {
    return;
  }

  const dirName = path.dirname(filePath);

  for (const variant of VARIANTS) {
    const outputPath = path.resolve(dirName, `${baseName}${variant.suffix}.jpg`);

    await sharp(filePath)
      .rotate()
      .resize({
        width: variant.width,
        height: variant.width,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: variant.quality,
        mozjpeg: true,
      })
      .toFile(outputPath);

    console.log(`generated: ${path.relative(ROOT_DIR, outputPath)}`);
  }
}

async function main() {
  for (const targetDir of TARGET_DIRS) {
    try {
      const files = await walk(targetDir);
      for (const filePath of files) {
        await generateVariants(filePath);
      }
    } catch (error) {
      console.error(`failed: ${targetDir}`);
      console.error(error);
      process.exitCode = 1;
    }
  }
}

await main();