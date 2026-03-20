/// <reference types="webpack-dev-server" />
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");
const SHOULD_ANALYZE = process.env.WEBPACK_ANALYZE === "1";

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
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "development",
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
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    {
      apply: (compiler) => {
        compiler.hooks.compilation.tap("DeferMainCssPlugin", (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(
            "DeferMainCssPlugin",
            (data) => {
              const deferredStyleTags = [];

              data.headTags = data.headTags.map((tag) => {
                if (
                  tag.tagName === "link" &&
                  tag.attributes?.rel === "stylesheet" &&
                  typeof tag.attributes?.href === "string" &&
                  tag.attributes.href.includes("styles/main.css")
                ) {
                  deferredStyleTags.push({
                    tagName: "noscript",
                    voidTag: false,
                    meta: { plugin: "html-webpack-plugin" },
                    innerHTML: `<link rel=\"stylesheet\" href=\"${tag.attributes.href}\">`,
                  });

                  return {
                    ...tag,
                    attributes: {
                      ...tag.attributes,
                      rel: "preload",
                      as: "style",
                      onload: "this.onload=null;this.rel='stylesheet'",
                    },
                  };
                }

                return tag;
              });

              data.headTags.push(...deferredStyleTags);
              return data;
            },
          );
        });
      },
    },
    ...(SHOULD_ANALYZE
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: process.env.ANALYZER_MODE || "server",
            generateStatsFile: true,
            openAnalyzer: process.env.ANALYZER_OPEN !== "0",
            reportFilename: path.resolve(DIST_PATH, "bundle-report.html"),
            statsFilename: path.resolve(DIST_PATH, "bundle-stats.json"),
          }),
        ]
      : []),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
    alias: {},
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
    sideEffects: false,
  },
  cache: true,
};

module.exports = config;
