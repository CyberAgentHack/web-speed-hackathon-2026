import { createReadStream, createWriteStream, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createBrotliCompress, createGzip, constants } from "node:zlib";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { bundleStats } from "rollup-plugin-bundle-stats";
import { defineConfig, type Plugin } from "vite";

const COMPRESS_EXTENSIONS = new Set([".js", ".css", ".html", ".svg", ".json", ".wasm"]);
const COMPRESS_THRESHOLD = 1024; // bytes

function compressFile(filePath: string, ext: ".br" | ".gz"): Promise<void> {
  const outPath = filePath + ext;
  const source = createReadStream(filePath);
  const destination = createWriteStream(outPath);
  const compressor =
    ext === ".br"
      ? createBrotliCompress({
          params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
          },
        })
      : createGzip({ level: 9 });
  return pipeline(source, compressor, destination);
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function buildCompressPlugin(): Plugin {
  return {
    name: "vite-plugin-compress",
    apply: "build",
    enforce: "post",
    closeBundle: {
      sequential: true,
      order: "post",
      async handler() {
        const outDir = resolve(import.meta.dirname, "../dist");
        const files = walkDir(outDir).filter((f) => {
          const ext = extname(f);
          if (!COMPRESS_EXTENSIONS.has(ext)) return false;
          try {
            return statSync(f).size >= COMPRESS_THRESHOLD;
          } catch {
            return false;
          }
        });

        console.log(`\n[compress] Compressing ${files.length} files with Brotli + Gzip...`);
        await Promise.all(files.flatMap((f) => [compressFile(f, ".br"), compressFile(f, ".gz")]));
        console.log(`[compress] Done.\n`);
      },
    },
  };
}

const ROOT = import.meta.dirname;
const NM = resolve(ROOT, "node_modules");

export default defineConfig({
  root: resolve(ROOT, "src"),
  publicDir: resolve(ROOT, "../public"),

  plugins: [
    react(),
    tailwindcss(),
    bundleStats({ json: true, html: false, outDir: ".." }),
    buildCompressPlugin(),
  ],

  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": ROOT,
      "bayesian-bm25": resolve(NM, "bayesian-bm25/dist/index.js"),
      kuromoji: resolve(NM, "kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg": resolve(NM, "@ffmpeg/ffmpeg/dist/esm/index.js"),
    },
  },

  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] ?? ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api/v1": `http://localhost:${process.env["PORT"] || 3333}`,
      "/upload": `http://localhost:${process.env["PORT"] || 3333}`,
    },
  },

  build: {
    outDir: resolve(ROOT, "../dist"),
    emptyOutDir: true,
    copyPublicDir: true,
    ssrManifest: true,
    rolldownOptions: {
      output: {
        chunkFileNames: "scripts/chunk-[hash].js",
        entryFileNames: "scripts/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id: string) {
          // Split React core into a separate vendor chunk for better caching
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // Split routing + data fetching into separate chunk
          if (id.includes("node_modules/react-router") || id.includes("node_modules/swr/")) {
            return "vendor-router";
          }
          // Split redux ecosystem (only needed for forms)
          if (
            id.includes("node_modules/redux") ||
            id.includes("node_modules/react-redux") ||
            id.includes("node_modules/redux-form")
          ) {
            return "vendor-redux";
          }
        },
      },
    },
  },
});
