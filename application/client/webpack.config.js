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
  devtool: isProduction ? false : "eval-source-map",
  entry: { main: path.resolve(SRC_PATH, "./index.tsx") },
  output: {
    path: DIST_PATH,
    filename: "s/[name].[contenthash:8].js",
    chunkFilename: "s/[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.(jsx?|tsx?)$/, exclude: /node_modules/, use: "babel-loader" },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "kuromoji$": path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "c/[name].[contenthash:8].css" }),
    new HtmlWebpackPlugin({ template: path.resolve(SRC_PATH, "./index.html"), inject: "body" }),
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "node_modules/katex/dist/fonts"), to: "fonts" }],
    }),
  ],
  optimization: {
    minimize: isProduction,
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: "fw",
          priority: 40,
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          priority: 20,
        },
      },
    },
  },
};
