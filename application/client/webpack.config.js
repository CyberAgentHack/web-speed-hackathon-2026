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

const isProd = process.env.NODE_ENV === "production";

/** @type {import('webpack').Configuration} */
const config = {
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
  devtool: isProd ? false : "eval-cheap-module-source-map",
  entry: {
    main: [
      ...(isProd ? [] : ["core-js", "regenerator-runtime/runtime"]),
      "jquery-binarytransport",
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: isProd ? "production" : "development",
  module: {
    rules: [
      {
        exclude: (modulePath) => {
          if (!modulePath.includes(`${path.sep}node_modules${path.sep}`)) {
            return false;
          }
          return !/node_modules[/\\]react-syntax-highlighter([/\\]|$)/.test(modulePath);
        },
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              envName: isProd ? "production" : "development",
            },
          },
        ],
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
    chunkFilename: isProd ? "scripts/chunk-[contenthash:8].js" : "scripts/chunk-[contenthash].js",
    filename: isProd ? "scripts/[name].[contenthash:8].js" : "scripts/[name].js",
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
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: isProd ? "production" : "development",
    }),
    new MiniCssExtractPlugin({
      filename: isProd ? "styles/[name].[contenthash:8].css" : "styles/[name].css",
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
      inject: "body",
      scriptLoading: "defer",
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
  optimization: isProd
    ? {
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            heavy: {
              chunks: "async",
              priority: 30,
              test: /[\\/]node_modules[\\/](@ffmpeg|@imagemagick)[\\/]/,
            },
          },
        },
      }
    : {
        minimize: false,
        splitChunks: false,
        concatenateModules: false,
        usedExports: false,
        providedExports: false,
        sideEffects: false,
      },
  cache: false,
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
