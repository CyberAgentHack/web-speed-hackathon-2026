import fs from "fs/promises";
import path from "path";
import { brotliCompress, constants as zlibConstants, gzip } from "node:zlib";
import { promisify } from "node:util";

import { CLIENT_DIST_PATH, PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const brotliCompressAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

const COMPRESSIBLE_ASSET_EXTENSION_PATTERN = /\.(?:css|html|js|json|map|svg|txt|xml)$/i;
const PRECOMPRESSED_EXTENSION_PATTERN = /\.(?:br|gz)$/;

async function walkDirectory(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return walkDirectory(entryPath);
      }

      return [entryPath];
    }),
  );

  return files.flat();
}

async function compressFile(filePath: string) {
  if (PRECOMPRESSED_EXTENSION_PATTERN.test(filePath) || !COMPRESSIBLE_ASSET_EXTENSION_PATTERN.test(filePath)) {
    return;
  }

  const fileContents = await fs.readFile(filePath);
  const [brotliContents, gzipContents] = await Promise.all([
    brotliCompressAsync(fileContents, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 5,
      },
    }),
    gzipAsync(fileContents),
  ]);

  await Promise.all([fs.writeFile(`${filePath}.br`, brotliContents), fs.writeFile(`${filePath}.gz`, gzipContents)]);
}

async function compressDirectory(directoryPath: string) {
  const files = await walkDirectory(directoryPath);
  await Promise.all(files.map((filePath) => compressFile(filePath)));
}

await Promise.all([compressDirectory(CLIENT_DIST_PATH), compressDirectory(PUBLIC_PATH)]);
