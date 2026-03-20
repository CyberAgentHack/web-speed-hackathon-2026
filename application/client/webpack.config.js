/// <reference types="webpack-dev-server" />
import { resolve as _resolve } from "path";

import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import webpackBundleAnalyzer from "webpack-bundle-analyzer";

const __dirname = import.meta.dirname;
const { ProvidePlugin, EnvironmentPlugin } = webpack;

const SRC_PATH = _resolve(__dirname, "./src");
const PUBLIC_PATH = _resolve(__dirname, "../public");
const UPLOAD_PATH = _resolve(__dirname, "../upload");
const DIST_PATH = _resolve(__dirname, "../dist");

/** @type {import('webpack').Configuration} */
const config = {
  cache: {
    type: "filesystem",
  },
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
  devtool: "inline-source-map",
  entry: {
    main: [
      "jquery-binarytransport",
      _resolve(SRC_PATH, "./index.css"),
      _resolve(SRC_PATH, "./buildinfo.ts"),
      _resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: "none",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: "esbuild-loader",
        options: {
          target: "chrome140",
          tsconfig: "tsconfig.json",
        },
        resolve: {
          fullySpecified: false,
        },
        test: /\.[jt]sx?$/,
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
    new ProvidePlugin({
      $: "jquery",
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
      "window.jQuery": "jquery",
    }),
    new EnvironmentPlugin({
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
          from: _resolve(__dirname, "node_modules/katex/dist/fonts"),
          to: _resolve(DIST_PATH, "styles/fonts"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: _resolve(SRC_PATH, "./index.html"),
    }),
    new webpackBundleAnalyzer.BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE ? "server" : "disabled",
      openAnalyzer: false,
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
      "bayesian-bm25$": _resolve(
        __dirname,
        "node_modules",
        "bayesian-bm25/dist/index.js",
      ),
      ["kuromoji$"]: _resolve(
        __dirname,
        "node_modules",
        "kuromoji/build/kuromoji.js",
      ),
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
      chunks: "async",
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
};

export default config;
