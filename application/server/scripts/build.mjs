import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, "..");
const distDir = path.resolve(serverRoot, "dist");

await mkdir(distDir, { recursive: true });

await build({
  absWorkingDir: serverRoot,
  bundle: true,
  entryPoints: [path.resolve(serverRoot, "src/index.ts")],
  format: "esm",
  legalComments: "none",
  outfile: path.resolve(distDir, "index.js"),
  packages: "external",
  platform: "node",
  target: "node24",
  tsconfig: path.resolve(serverRoot, "tsconfig.json"),
});

await cp(
  path.resolve(serverRoot, "src/routes/api/crok-response.md"),
  path.resolve(distDir, "crok-response.md"),
);
