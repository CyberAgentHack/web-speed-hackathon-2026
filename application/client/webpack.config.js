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

/**
 * @param {unknown} _env
 * @param {import("webpack").CliConfigOptions} argv
 * @returns {import("webpack").Configuration}
 */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === "production" || process.env.NODE_ENV === "production";

  return {
    mode: isProduction ? "production" : "development",
    devServer: {
      historyApiFallback: true,
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
    devtool: isProduction ? false : "inline-source-map",
    entry: {
      main: [
        "core-js",
        "regenerator-runtime/runtime",
        "jquery-binarytransport",
        path.resolve(SRC_PATH, "./index.css"),
        path.resolve(SRC_PATH, "./buildinfo.ts"),
        path.resolve(SRC_PATH, "./index.tsx"),
      ],
    },
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
      // ハッシュを付けず固定ファイル名に戻す（index.htmlの直書きと揃える）
      chunkFilename: "scripts/chunk-[id].js",
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
        NODE_ENV: isProduction ? "production" : "development",
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? "styles/[name]-[contenthash].css" : "styles/[name].css",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "node_modules/katex/dist/fonts"),
            to: path.resolve(DIST_PATH, "styles/fonts"),
          },
        ],
      }),
      new HtmlWebpackPlugin({
        inject: false, // index.html の直書きを利用
        template: path.resolve(SRC_PATH, "./index.html"),
      }),
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
      // 大きな vendor チャンクを作らず、固定ファイル名で一括出力
      splitChunks: false,
      runtimeChunk: false,
      minimize: isProduction,
      usedExports: isProduction,
    },
    cache: isProduction
      ? {
          type: "filesystem",
        }
      : false,
    ignoreWarnings: [
      {
        module: /@ffmpeg/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ],
  };
};
