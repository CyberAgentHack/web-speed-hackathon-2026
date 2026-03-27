import { mkdirSync, readdirSync, rmSync } from "fs";
import path from "path";
import type { BunPlugin } from "bun";

const SRC_PATH = path.resolve(import.meta.dir, "./src");
const DIST_PATH = path.resolve(import.meta.dir, "../dist");

const binaryPlugin: BunPlugin = {
  name: "binary-loader",
  setup(build) {
    build.onResolve({ filter: /\?binary$/ }, (args) => {
      const cleanPath = args.path.replace(/\?binary$/, "");
      const resolved = require.resolve(cleanPath, { paths: [args.resolveDir] });
      return {
        path: resolved,
        namespace: "binary",
      };
    });

    build.onLoad({ filter: /.*/, namespace: "binary" }, async (args) => {
      const bytes = await Bun.file(args.path).arrayBuffer();
      return {
        contents: `export default new Uint8Array([${new Uint8Array(bytes)}])`,
        loader: "js",
      };
    });
  },
};

const aliases: Record<string, string> = {
  "@ffmpeg/ffmpeg": path.resolve(import.meta.dir, "node_modules/@ffmpeg/ffmpeg/dist/esm/index.js"),
  "@ffmpeg/core": path.resolve(import.meta.dir, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js"),
  "@ffmpeg/core/wasm": path.resolve(import.meta.dir, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm"),
  "@imagemagick/magick-wasm/magick.wasm": path.resolve(import.meta.dir, "node_modules/@imagemagick/magick-wasm/dist/magick.wasm"),
  "bayesian-bm25": path.resolve(import.meta.dir, "node_modules/bayesian-bm25/dist/index.js"),
  "kuromoji": path.resolve(import.meta.dir, "node_modules/kuromoji/build/kuromoji.js"),
};

const aliasPlugin: BunPlugin = {
  name: "alias-resolver",
  setup(build) {
    build.onResolve({ filter: /^\/fonts\// }, (args) => {
      return { path: args.path, external: true };
    });

    for (const [alias, target] of Object.entries(aliases)) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\/@]/g, "\\$&");
      build.onResolve({ filter: new RegExp(`^${escapedAlias}$`) }, () => ({ path: target }));
    }

    build.onResolve({ filter: /^(fs|path|url)$/ }, (args) => {
      return { path: args.path, namespace: "empty-module" };
    });

    build.onLoad({ filter: /.*/, namespace: "empty-module" }, () => {
      return { contents: "export default {};", loader: "js" };
    });
  },
};

rmSync(DIST_PATH, { recursive: true, force: true });
mkdirSync(DIST_PATH, { recursive: true });

const result = await Bun.build({
  entrypoints: [path.resolve(SRC_PATH, "./index.html")],
  outdir: DIST_PATH,
  minify: true,
  target: "browser",
  naming: {
    entry: "assets/[name]-[hash].[ext]",
    chunk: "assets/[name]-[hash].[ext]",
    asset: "assets/[name]-[hash].[ext]",
  },
  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] || ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [
    binaryPlugin,
    aliasPlugin,
    (await import("bun-plugin-tailwind")).default,
  ],
});

if (!result.success) {
  console.error("Build failed:");
  for (const msg of result.logs) {
    console.error(msg);
  }
  process.exit(1);
}

const generatedHtmlPath = readdirSync(path.resolve(DIST_PATH, "assets"))
  .map((name) => path.resolve(DIST_PATH, "assets", name))
  .find((filePath) => filePath.endsWith(".html"));

if (generatedHtmlPath == null) {
  console.error("Build failed: Bun did not emit an HTML entrypoint.");
  process.exit(1);
}

const generatedHtml = await Bun.file(generatedHtmlPath).text();
const rewrittenHtml = generatedHtml
  .replace(/href="\.\//g, 'href="/assets/')
  .replace(/src="\.\//g, 'src="/assets/');
await Bun.write(path.resolve(DIST_PATH, "index.html"), rewrittenHtml);
rmSync(generatedHtmlPath);

console.log("Build completed successfully!");
