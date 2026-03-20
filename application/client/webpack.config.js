/// <reference types="webpack-dev-server" />
const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOAD_PATH = path.resolve(__dirname, "../upload");
const DIST_PATH = path.resolve(__dirname, "../dist");

class EntrypointsManifestPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync("EntrypointsManifestPlugin", (compilation, callback) => {
      const manifest = {};
      for (const [name, entrypoint] of compilation.entrypoints) {
        const js = [];
        const css = [];
        for (const chunk of entrypoint.chunks) {
          for (const file of chunk.files) {
            if (file.endsWith(".js")) {
              js.push("/" + file);
            } else if (file.endsWith(".css")) {
              css.push("/" + file);
            }
          }
        }
        manifest[name] = { js, css };
      }
      const json = JSON.stringify(manifest, null, 2);
      compilation.assets["entrypoints.json"] = {
        source: () => json,
        size: () => json.length,
      };
      callback();
    });
  }
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
  devtool: false,
  entry: {
    timeline: path.resolve(SRC_PATH, "./pages/timeline.tsx"),
    "dm-list": path.resolve(SRC_PATH, "./pages/dm-list.tsx"),
    dm: path.resolve(SRC_PATH, "./pages/dm.tsx"),
    search: path.resolve(SRC_PATH, "./pages/search.tsx"),
    "user-profile": path.resolve(SRC_PATH, "./pages/user-profile.tsx"),
    post: path.resolve(SRC_PATH, "./pages/post.tsx"),
    terms: path.resolve(SRC_PATH, "./pages/terms.tsx"),
    crok: path.resolve(SRC_PATH, "./pages/crok.tsx"),
    "not-found": path.resolve(SRC_PATH, "./pages/not-found.tsx"),
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
    filename: "scripts/[name]-[contenthash].js",
    path: DIST_PATH,
    publicPath: "/",
    clean: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
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
    new EntrypointsManifestPlugin(),
  ],
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
  cache: false,
  ignoreWarnings: [],
};

module.exports = config;
