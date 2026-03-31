import path from "path";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { visualizer } from "rollup-plugin-visualizer";
// Plugins handled above

export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: path.resolve(
                        __dirname,
                        "node_modules/katex/dist/fonts/*",
                    ),
                    dest: "styles/fonts",
                },
            ],
        }),
        visualizer(),
    ],
    resolve: {
        tsconfigPaths: true,
        alias: [
            {
                find: /^bayesian-bm25$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "bayesian-bm25",
                    "dist",
                    "index.js",
                ),
            },
            {
                find: /^kuromoji$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "kuromoji",
                    "build",
                    "kuromoji.js",
                ),
            },
            {
                find: /^\@ffmpeg\/ffmpeg$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "@ffmpeg",
                    "ffmpeg",
                    "dist",
                    "esm",
                    "index.js",
                ),
            },
            {
                find: /^\@ffmpeg\/core\/wasm$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "@ffmpeg",
                    "core",
                    "dist",
                    "umd",
                    "ffmpeg-core.wasm",
                ),
            },
            {
                find: /^\@ffmpeg\/core$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "@ffmpeg",
                    "core",
                    "dist",
                    "umd",
                    "ffmpeg-core.js",
                ),
            },
            {
                find: /^\@imagemagick\/magick-wasm\/magick\.wasm$/,
                replacement: path.resolve(
                    __dirname,
                    "node_modules",
                    "@imagemagick",
                    "magick-wasm",
                    "dist",
                    "magick.wasm",
                ),
            },
            {
                find: "@web-speed-hackathon-2026/client",
                replacement: path.resolve(__dirname),
            },
        ],
    },
    define: {
        "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
        "process.env.COMMIT_HASH": JSON.stringify(
            process.env.SOURCE_VERSION || "",
        ),
        "process.env.NODE_ENV": JSON.stringify(
            process.env.NODE_ENV || "development",
        ),
    },
    server: {
        host: "0.0.0.0",
        port: 8080,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
            },
        },
    },
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: "scripts/[name].js",
                chunkFileNames: "scripts/chunk-[hash].js",
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith(".css")) {
                        return "styles/[name][extname]";
                    }
                    return "assets/[name]-[hash][extname]";
                },
            },
        },
    },
});
