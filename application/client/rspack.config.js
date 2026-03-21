const path = require("path");
const rspack = require("@rspack/core");
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
    port: 3000,
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8080",
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
                parser: { syntax: "typescript", tsx: true },
                transform: { react: { runtime: "automatic" } },
              },
              env: { targets: "last 1 Chrome version" },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          { loader: rspack.CssExtractRspackPlugin.loader },
          {
            loader: "css-loader",
            options: {
              url: {
                filter: (_url, resourcePath) => resourcePath.endsWith("katex.css"),
              },
            },
          },
          { loader: "postcss-loader" },
        ],
      },
      {
        test: /\.(woff2?|ttf)$/i,
        type: "asset/resource",
        generator: {
          filename: "styles/fonts/[name][ext]",
        },
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
    new rspack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new rspack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
    }),
    new rspack.CssExtractRspackPlugin({
      filename: "styles/[name].css",
    }),
    new rspack.HtmlRspackPlugin({
      inject: true,
      template: path.resolve(SRC_PATH, "./index.html"),
      scriptLoading: "defer",
    }),
    process.env.RSDOCTOR && new RsdoctorRspackPlugin(),
  ].filter(Boolean),
  resolve: {
    conditionNames: ["browser", "module", "..."],
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
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-redux|react-router|scheduler|@remix-run[\\/]router)[\\/]/,
          name: "vendor",
          filename: "scripts/vendor-[contenthash].js",
          priority: 20,
          enforce: true,
        },
      },
    },
  },
  ignoreWarnings: [],
};

module.exports = config;
