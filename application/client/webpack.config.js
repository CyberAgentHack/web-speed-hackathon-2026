/// <reference types="webpack-dev-server" />
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

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
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
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
    filename: "scripts/[name]-[contenthash].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/[name]-[contenthash].css",
      runtime: false,
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
      inject: "head",
      scriptLoading: "defer",
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    new HTMLInlineCSSWebpackPlugin(),
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
    },
    fallback: {
      fs: false,
      path: false,
      url: false,
    },
  },
  optimization: {
    chunkIds: "deterministic",
    moduleIds: "deterministic",
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            passes: 2,
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              // Disabling calc reduction prevents sub-pixel rounding differences
              // caused by converting calc(2/1.5) → 1.33333, which shifts layout
              calc: false,
            },
          ],
        },
      }),
    ],
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      maxSize: 500000,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux|redux)[\\/]/,
          name: "framework",
          chunks: "all",
          priority: 20,
          enforce: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          priority: 10,
          reuseExistingChunk: true,
          minChunks: 2,
        },
      },
    },
    usedExports: true,
    sideEffects: true,
  },
  cache: {
    type: "filesystem",
  },
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
