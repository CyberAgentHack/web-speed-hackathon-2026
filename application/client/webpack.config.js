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
  devtool: isProduction ? false : "source-map",
  entry: {
    main: [
      "core-js",
      "regenerator-runtime/runtime",
      path.resolve(SRC_PATH, "./index.tsx")
    ]
  },
  output: {
    path: DIST_PATH,
    filename: "scripts/[name].[contenthash:8].js",
    chunkFilename: "scripts/[name].[contenthash:8].js",
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
      { resourceQuery: /binary/, type: "asset/bytes" },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "kuromoji$": path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg$": path.resolve(__dirname, "node_modules/@ffmpeg/ffmpeg/dist/esm/index.js"),
      "@ffmpeg/core$": path.resolve(__dirname, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js"),
      "@ffmpeg/core/wasm$": path.resolve(__dirname, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm"),
      "@imagemagick/magick-wasm/magick.wasm$": path.resolve(__dirname, "node_modules/@imagemagick/magick-wasm/dist/magick.wasm"),
    },
    fallback: {
      fs: false,
      path: false,
      url: false,
      buffer: require.resolve("buffer/"),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "styles/[name].[contenthash:8].css" }),
    new HtmlWebpackPlugin({ template: path.resolve(SRC_PATH, "./index.html"), inject: "body" }),
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "node_modules/katex/dist/fonts"), to: "styles/fonts" }],
    }),
  ],
  optimization: {
    minimize: isProduction,
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: "vendor", priority: -10 },
      },
    },
  },
};
