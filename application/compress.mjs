import { readdir, stat } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createBrotliCompress, createGzip, constants } from "node:zlib";
import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dirname, "./dist");
const TARGET_EXT = /\.(js|css|html|svg|json|txt|xml|map)$/;

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(fullPath)));
    } else if (TARGET_EXT.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function compressFile(filePath) {
  const info = await stat(filePath);
  if (!info.isFile()) return;

  const gzipTask = pipeline(
    createReadStream(filePath),
    createGzip({ level: 9 }),
    createWriteStream(`${filePath}.gz`),
  );

  const brotliTask = pipeline(
    createReadStream(filePath),
    createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      },
    }),
    createWriteStream(`${filePath}.br`),
  );

  await Promise.all([gzipTask, brotliTask]);
}

const files = await collectFiles(DIST_DIR);
console.log(`Compressing ${files.length} assets...`);
await Promise.all(files.map(compressFile));
console.log("Compression complete.");
