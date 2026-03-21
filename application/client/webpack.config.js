const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const DIST_PATH = path.resolve(__dirname, "../dist");
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  mode: isProduction ? "production" : "development",
  devtool: false, // ビルドを速くし、メモリ消費を抑える
  entry: {
    main: path.resolve(SRC_PATH, "./index.tsx"),
  },
  output: {
    path: DIST_PATH,
    filename: "s/[name].js",
    chunkFilename: "s/[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.(jsx?|tsx?)$/, exclude: /node_modules/, use: "babel-loader" },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"] },
      { resourceQuery: /binary/, type: "asset/bytes" },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "kuromoji$": path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
    },
    fallback: { fs: false, path: false, url: false, buffer: require.resolve("buffer/") },
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "c/[name].css" }),
    new HtmlWebpackPlugin({ template: path.resolve(SRC_PATH, "./index.html"), inject: "body" }),
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"], process: "process/browser" }),
  ],
  optimization: {
    minimize: isProduction,
    splitChunks: { chunks: "all" },
  },
};
