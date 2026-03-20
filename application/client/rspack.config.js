const path = require("path");

const { rspack } = require("@rspack/core");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");
const REPORTS_PATH = path.resolve(__dirname, "../reports");
const SHOULD_ANALYZE = process.env.ANALYZE === "true";

/** @type {import('@rspack/core').Configuration} */
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
  mode: "production",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                    development: false,
                  },
                },
              },
              env: {
                targets: "last 2 Chrome versions",
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          { loader: rspack.CssExtractRspackPlugin.loader },
          { loader: "css-loader", options: { url: false } },
          { loader: "postcss-loader" },
        ],
        type: "javascript/auto",
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
    new rspack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
    }),
    new rspack.CssExtractRspackPlugin({
      filename: "styles/[name].css",
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "node_modules/katex/dist/fonts"),
          to: path.resolve(DIST_PATH, "styles/fonts"),
        },
      ],
    }),
    new rspack.HtmlRspackPlugin({
      inject: false,
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    ...(SHOULD_ANALYZE
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
            reportFilename: path.resolve(REPORTS_PATH, "bundle-report.html"),
            generateStatsFile: true,
            statsFilename: path.resolve(REPORTS_PATH, "webpack-stats.json"),
          }),
        ]
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
      chunks: "async",
      minRemainingSize: 0,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          reuseExistingChunk: true,
          priority: -10,
        },
        default: {
          minChunks: 2,
          reuseExistingChunk: true,
          priority: -20,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  ignoreWarnings: [],
};

module.exports = config;
