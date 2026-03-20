const path = require("path");
const { rspack } = require("@rspack/core");
const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

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
  devtool: "source-map",
  entry: {
    main: [
      "core-js",
      "regenerator-runtime/runtime",
      "jquery-binarytransport",
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: "development",
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
              //   parser: {
              //     syntax: "typescript",
              //     tsx: true,
              //   },
              transform: {
                react: {
                //       // development: true,
                  runtime: "automatic",
                },
              },
              },
              env: {
                // targets: "ie 11",
                // coreJs: "3",
                // mode: undefined,
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [{ loader: "postcss-loader" }],
        type: "css",
      },
      {
        resourceQuery: /binary/,
        type: "asset/inline",
      },
    ],
    parser: {
      css: {
        namedExports: false,
        url: false,
      },
    },
  },
  output: {
    filename: "scripts/[name].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
    cssFilename: "styles/[name].css",
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
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "development",
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
      inject: true,
      template: path.resolve(SRC_PATH, "./index.html"),
    }),
    process.env.ALY && new RsdoctorRspackPlugin({
      port: 4000,
    }),
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
    minimize: true,
    splitChunks: {
      name: 'vendor',
      chunks: 'initial',
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  experiments: {
    css: true,
  },
  ignoreWarnings: [/Critical dependency/],
};

module.exports = config;
