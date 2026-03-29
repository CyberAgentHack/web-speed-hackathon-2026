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

const isProduction = process.env.NODE_ENV === "production";

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
  devtool: isProduction ? false : "eval-source-map",
  entry: {
    main: [
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: isProduction ? "production" : "development",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [{ loader: "babel-loader" }],
      },
      {
        resourceQuery: /raw/,
        type: "asset/source",
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
    filename: "scripts/[name]-[contenthash].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: isProduction ? "production" : "development",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/[name]-[contenthash].css",
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
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    new webpack.NormalModuleReplacementPlugin(
      /[\\/]negaposi-analyzer-ja[\\/].*[\\/]dict[\\/]pn_ja\.dic\.json$/,
      path.resolve(SRC_PATH, "./utils/negaposi_dict_fallback.json"),
    ),
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
      "@ffmpeg/ffmpeg/worker$": path.resolve(
        __dirname,
        "node_modules",
        "@ffmpeg/ffmpeg/dist/esm/worker.js",
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
    minimize: isProduction,
    splitChunks: {
      chunks: "all",
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux|redux|scheduler)[\\/]/,
          name: "vendor-react",
          chunks: "all",
          priority: 20,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
          priority: 10,
        },
        asyncVendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "async",
          priority: 5,
          minSize: 50000,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
