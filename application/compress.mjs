import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { createBrotliCompress, createGzip, constants } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";

const DIST_PATH = path.resolve(import.meta.dirname, "./dist");
const COMPRESSIBLE = /\.(js|css|html|svg|json|txt|xml|map)$/;

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else if (COMPRESSIBLE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function compress(filePath) {
  // Brotli
  await pipeline(
    createReadStream(filePath),
    createBrotliCompress({
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      },
    }),
    createWriteStream(filePath + ".br"),
  );

  // Gzip
  await pipeline(
    createReadStream(filePath),
    createGzip({ level: 9 }),
    createWriteStream(filePath + ".gz"),
  );
}

const files = await walkDir(DIST_PATH);
console.log(`Compressing ${files.length} files...`);
await Promise.all(files.map(compress));
console.log("Done!");