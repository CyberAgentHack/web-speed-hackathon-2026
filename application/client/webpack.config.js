/// <reference types="webpack-dev-server" />
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

const commonEntryPrefix = [
  "core-js",
  "regenerator-runtime/runtime",
  "jquery-binarytransport",
  path.resolve(SRC_PATH, "./index.css"),
  path.resolve(SRC_PATH, "./buildinfo.ts"),
];

const pageEntries = [
  { name: "timeline", file: "./entries/timeline.tsx", html: "index.html" },
  { name: "post-detail", file: "./entries/post-detail.tsx", html: "post-detail.html" },
  { name: "user-profile", file: "./entries/user-profile.tsx", html: "user-profile.html" },
  { name: "search", file: "./entries/search.tsx", html: "search.html" },
  { name: "dm-list", file: "./entries/dm-list.tsx", html: "dm-list.html" },
  { name: "dm", file: "./entries/dm.tsx", html: "dm.html" },
  { name: "crok", file: "./entries/crok.tsx", html: "crok.html" },
  { name: "terms", file: "./entries/terms.tsx", html: "terms.html" },
  { name: "not-found", file: "./entries/not-found.tsx", html: "not-found.html" },
];

/** @type {import('webpack').Configuration} */
const config = {
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/posts\//, to: "/post-detail.html" },
        { from: /^\/users\//, to: "/user-profile.html" },
        { from: /^\/search$/, to: "/search.html" },
        { from: /^\/dm\//, to: "/dm.html" },
        { from: /^\/dm$/, to: "/dm-list.html" },
        { from: /^\/crok$/, to: "/crok.html" },
        { from: /^\/terms$/, to: "/terms.html" },
        { from: /.*/, to: "/not-found.html" },
      ],
    },
    host: "0.0.0.0",
    port: 8080,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:3000",
      },
    ],
    static: [PUBLIC_PATH, UPLOAD_PATH],
  },
  devtool: "inline-source-map",
  entry: Object.fromEntries(
    pageEntries.map(({ name, file }) => [
      name,
      [...commonEntryPrefix, path.resolve(SRC_PATH, file)],
    ]),
  ),
  mode: "none",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [{ loader: "babel-loader" }],
      },
      {
        test: /\.css$/i,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader", options: { url: false } },
          { loader: "postcss-loader" },
        ],
      },
      {
        resourceQuery: /binary/,
        type: "asset/bytes",
      },
    ],
  },
  output: {
    chunkFilename: "scripts/chunk-[contenthash].js",
    filename: "scripts/[name].js",
    path: DIST_PATH,
    publicPath: "auto",
    clean: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
      "window.jQuery": "jquery",
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "development",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/[name].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "node_modules/katex/dist/fonts"),
          to: path.resolve(DIST_PATH, "styles/fonts"),
        },
      ],
    }),
    ...pageEntries.map(
      ({ name, html }) =>
        new HtmlWebpackPlugin({
          chunks: [name],
          filename: html,
          inject: true,
          template: path.resolve(SRC_PATH, "./index.html"),
        }),
    ),
    {
      apply(compiler) {
        compiler.hooks.watchRun.tap("RebuildLogger", () => {
          console.log(`\n[${new Date().toLocaleTimeString()}] 変更検知 → 再ビルド開始...`);
        });
        compiler.hooks.done.tap("RebuildLogger", (stats) => {
          const ms = stats.endTime - stats.startTime;
          const status = stats.hasErrors() ? "エラーあり" : "成功";
          console.log(`[${new Date().toLocaleTimeString()}] 再ビルド完了 (${ms}ms) [${status}]`);
        });
      },
    },
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
      "bayesian-bm25$": path.resolve(__dirname, "node_modules", "bayesian-bm25/dist/index.js"),
      ["kuromoji$"]: path.resolve(__dirname, "node_modules", "kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/ffmpeg/dist/esm/index.js",
      ),
      "@ffmpeg/core$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/core/dist/umd/ffmpeg-core.js",
      ),
      "@ffmpeg/core/wasm$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
      ),
      "@imagemagick/magick-wasm/magick.wasm$": path.resolve(
        __dirname,
        "node_modules",
        "@imagemagick/magick-wasm/dist/magick.wasm",
      ),
    },
    fallback: {
      fs: false,
      path: false,
      url: false,
    },
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: "all",
    },
    concatenateModules: false,
    usedExports: false,
    providedExports: false,
    sideEffects: false,
  },
  cache: { type: "filesystem" },
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
