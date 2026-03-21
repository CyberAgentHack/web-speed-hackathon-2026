const path = require("path");
const { rspack } = require("@rspack/core");
const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

const analyzing = process.env.ALY;

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
        ws: true,
      },
    ],
    static: [
      PUBLIC_PATH,
      {
        directory: UPLOAD_PATH,
        watch: false,
      },
    ],
  },
  devtool: "source-map",
  mode: analyzing ? "development" : undefined,
  entry: {
    main: [
      // "core-js",
      // "regenerator-runtime/runtime",
      path.resolve(SRC_PATH, "./index.css"),
      path.resolve(SRC_PATH, "./buildinfo.ts"),
      path.resolve(SRC_PATH, "./index.tsx"),
    ],
  },
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
                targets: "last 1 chrome versions",
                mode: "usage",
                // coreJs: "3",
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
      Buffer: ["buffer", "Buffer"],
    }),
    new rspack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
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
    analyzing && new RsdoctorRspackPlugin({
      port: 4000,
    }),
  ].filter(Boolean),
  resolve: {
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
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
