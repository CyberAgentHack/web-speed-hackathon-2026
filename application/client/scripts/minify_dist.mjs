import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transform } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../../dist");

async function minifyDir(dirPath, extension, loader) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();

  for (const filePath of files) {
    const code = await fs.readFile(filePath, "utf8");
    const result = await transform(code, {
      minify: true,
      loader,
      target: "es2020",
    });
    await fs.writeFile(filePath, result.code);
  }
}

await minifyDir(path.join(distPath, "scripts"), ".js", "js");
await minifyDir(path.join(distPath, "styles"), ".css", "css");
