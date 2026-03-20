/// <reference types="webpack-dev-server" />
const path = require("path");

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");
const ANALYZE_MODE =
  process.env.ANALYZE === "static" ? "static" : process.env.ANALYZE ? "server" : null;

const plugins = [
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
    "process.env.COMMIT_HASH": JSON.stringify(process.env.SOURCE_VERSION || ""),
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
    inject: "body",
    template: path.resolve(SRC_PATH, "./index.html"),
  }),
];

if (ANALYZE_MODE) {
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: ANALYZE_MODE,
      analyzerPort: 8888,
      generateStatsFile: true,
      openAnalyzer: true,
      reportFilename: "bundle-report.html",
      statsFilename: "bundle-stats.json",
    }),
  );
}

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
  devtool: "source-map",
  entry: {
    main: [
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
    chunkFormat: "array-push",
    filename: "scripts/[name].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins,
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {
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
    minimize: true,
    splitChunks: {
      chunks: "all",
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  cache: {
    type: "filesystem",
  },
  ignoreWarnings: [],
};

module.exports = config;
