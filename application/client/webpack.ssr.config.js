const path = require("path");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const DIST_PATH = path.resolve(__dirname, "../dist/ssr");

/** @type {import('webpack').Configuration} */
const config = {
  target: "node",
  entry: path.resolve(SRC_PATH, "./entry-server.tsx"),
  mode: "production",
  output: {
    filename: "entry-server.cjs",
    path: DIST_PATH,
    libraryTarget: "commonjs2",
    clean: true,
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
        use: [{ loader: path.resolve(__dirname, "ssr-null-loader.js") }],
      },
      {
        resourceQuery: /binary/,
        type: "asset/inline",
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "development",
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname, "."),
      "bayesian-bm25$": path.resolve(__dirname, "node_modules", "bayesian-bm25/dist/index.js"),
      ["kuromoji$"]: path.resolve(__dirname, "node_modules", "kuromoji/build/kuromoji.js"),
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
    splitChunks: false,
  },
  cache: false,
};

module.exports = config;
