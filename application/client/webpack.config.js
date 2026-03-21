/// <reference types="webpack-dev-server" />
const path = require("path");

const CompressionPlugin = require("compression-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const zlib = require("zlib");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

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
  devtool: false,
  entry: {
    main: [
      path.resolve(SRC_PATH, "./tailwind.css"),
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: "production",
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
        type: "asset/resource",
        generator: {
          filename: "assets/[contenthash][ext]",
        },
      },
    ],
  },
  output: {
    chunkFilename: "scripts/chunk-[contenthash].js",
    filename: "scripts/[name].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
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
    new HtmlWebpackPlugin({
      inject: true,
      scriptLoading: "defer",
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css)$/,
      threshold: 1024,
      minRatio: 0.8,
    }),
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      compressionOptions: {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
      },
      test: /\.(js|css)$/,
      threshold: 1024,
      minRatio: 0.8,
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
      "bayesian-bm25$": path.resolve(__dirname, "node_modules", "bayesian-bm25/dist/index.js"),
      ["kuromoji$"]: path.resolve(__dirname, "node_modules", "kuromoji/build/kuromoji.js"),

    },
    fallback: {
      fs: false,
      path: false,
      url: false,
    },
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  cache: false,
  ignoreWarnings: [],
};

module.exports = config;
