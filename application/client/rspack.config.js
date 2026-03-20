// @ts-check
const path = require("path");

const { rspack } = require("@rspack/core");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");
const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin");

const isProduction = process.env.NODE_ENV === "production";

/** @type {import("@rspack/core").Configuration} */
const config = {
  target: ["web", "browserslist"],
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
  devtool: isProduction ? false : "inline-source-map",
  entry: {
    main: [
      "jquery-binarytransport",
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: isProduction ? "production" : "none",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(jsx?|tsx?|mjs|cjs)$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              env: {
                mode: "usage",
                coreJs: 3,
                targets: ["last 1 Chrome version"],
              },
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    development: !isProduction,
                    runtime: "automatic",
                  },
                },
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        type: "javascript/auto",
        use: [
          { loader: rspack.CssExtractRspackPlugin.loader },
          { loader: "css-loader", options: { url: false } },
          { loader: "postcss-loader" },
        ],
      },
      {
        resourceQuery: /url/,
        type: "asset/resource",
        generator: {
          filename: "scripts/[name]-[contenthash][ext]",
        },
      },
      {
        test: /\.wasm$/,
        type: "asset/resource",
        generator: {
          filename: "scripts/[name]-[contenthash][ext]",
        },
      },
    ],
  },
  output: {
    chunkFilename: "scripts/[name]-[contenthash].js",
    filename: "scripts/[name].js",
    path: DIST_PATH,
    publicPath: "auto",
    enabledWasmLoadingTypes: ["fetch"],
    clean: true,
  },
  plugins: [
    new rspack.ProvidePlugin({
      $: "jquery",
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
      "window.jQuery": "jquery",
    }),
    new rspack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: process.env.NODE_ENV || "production",
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
      inject: "head",
      scriptLoading: "defer",
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin({}),
  ].filter(Boolean),
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
    runtimeChunk: {
      name: "runtime",
    },
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        polyfills: {
          name: "polyfills",
          test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|jquery|jquery-binarytransport|buffer)[\\/]/,
          priority: 50,
          chunks: "initial",
          enforce: true,
        },
        framework: {
          name: "framework",
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux|redux|scheduler)[\\/]/,
          priority: 40,
          chunks: "all",
          enforce: true,
        },
        vendors: {
          name: "vendors",
          test: /[\\/]node_modules[\\/]/,
          minChunks: 2,
          priority: 20,
          chunks: "all",
          enforce: true,
          reuseExistingChunk: true,
        },
        common: {
          name: "common",
          test: /[\\/]src[\\/]/,
          minChunks: 2,
          priority: 10,
          chunks: "all",
          reuseExistingChunk: true,
        },
        imageMagick: {
          name: "image-magick",
          test: /[\\/]node_modules[\\/]@imagemagick[\\/]magick-wasm[\\/]/,
          priority: 30,
          chunks: "all",
          enforce: true,
        },
        default: false,
        defaultVendors: false,
      },
    },
  },
  cache: true,
  ignoreWarnings: [
    {
      module: /@ffmpeg/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
};

module.exports = config;
