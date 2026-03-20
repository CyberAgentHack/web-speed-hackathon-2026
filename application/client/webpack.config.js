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
const isDevelopment = process.env['NODE_ENV'] === 'development';
const useAnalyzer = process.env['ANALYZE'] === 'true';

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
  devtool: isDevelopment ? 'eval-cheap-module-source-map' : false,
  entry: {
    main: [
      "regenerator-runtime/runtime",
      "jquery-binarytransport",
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: isDevelopment ? 'development' : 'production',
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
        type: "asset/bytes",
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
      $: "jquery",
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
      "window.jQuery": "jquery",
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: process.env.NODE_ENV || "production",
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
      inject: 'body',
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    ...(useAnalyzer
      ? [new BundleAnalyzerPlugin({ analyzerMode: "static", openAnalyzer: true })]
      : []),
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
      chunks: 'all',
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|redux|react-redux|redux-form|scheduler)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 30,
          enforce: true,
        },
        webllm: {
          test: /[\\/]node_modules[\\/]@mlc-ai[\\/]/,
          name: 'vendor-webllm',
          chunks: 'async',
          priority: 25,
          enforce: true,
        },
        heavy: {
          test: /[\\/]node_modules[\\/](kuromoji|bayesian-bm25|negaposi-analyzer-ja)[\\/]/,
          name: 'vendor-heavy',
          chunks: 'async',
          priority: 20,
          enforce: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: false,
    sideEffects: false,
  },
  cache: false,
  ignoreWarnings: [],
};

module.exports = config;
