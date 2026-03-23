import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";

const DIST_PATH = new URL("../dist", import.meta.url).pathname;
const COMPRESSIBLE_EXTS = new Set([".js", ".css", ".html", ".svg", ".json"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (COMPRESSIBLE_EXTS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = await walk(DIST_PATH);
let totalSaved = 0;

for (const file of files) {
  const content = await readFile(file);
  const original = content.length;

  const br = brotliCompressSync(content, {
    params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
  });
  await writeFile(file + ".br", br);

  const gz = gzipSync(content, { level: 9 });
  await writeFile(file + ".gz", gz);

  totalSaved += original - br.length;
}

console.log(
  `Compressed ${files.length} files, saved ~${(totalSaved / 1024).toFixed(0)} KB with Brotli`,
);
