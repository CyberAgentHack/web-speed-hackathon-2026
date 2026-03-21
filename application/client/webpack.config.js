/// <reference types="webpack-dev-server" />
import { resolve as _resolve } from "path";

import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";
import webpackBundleAnalyzer from "webpack-bundle-analyzer";

const __dirname = import.meta.dirname;
const { ProvidePlugin, EnvironmentPlugin } = webpack;
const { Compilation, sources } = webpack;

const SRC_PATH = _resolve(__dirname, "./src");
const PUBLIC_PATH = _resolve(__dirname, "../public");
const UPLOAD_PATH = _resolve(__dirname, "../upload");
const DIST_PATH = _resolve(__dirname, "../dist");

/**
 * CSS 内容は変えずに、配信時の空白とコメントだけを削る。
 * 追加依存なしで Lighthouse の "Minify CSS" を解消するための最小実装。
 * @param {string} css
 */
const minifyCss = (css) => {
  let result = "";
  let inString = false;
  let stringQuote = "";
  let pendingSpace = false;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];

    if (inString) {
      result += char;
      if (char === "\\") {
        index += 1;
        result += css[index] ?? "";
        continue;
      }
      if (char === stringQuote) {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (char === "/" && next === "*") {
      index += 2;
      while (index < css.length) {
        const commentChar = css[index];
        const commentNext = css[index + 1];
        if (commentChar === "*" && commentNext === "/") {
          index += 1;
          break;
        }
        index += 1;
      }
      pendingSpace = false;
      continue;
    }

    if (char === "'" || char === '"') {
      if (
        pendingSpace &&
        result.length > 0 &&
        !/[{:;,>~,(]/.test(result.at(-1) ?? "")
      ) {
        result += " ";
      }
      pendingSpace = false;
      inString = true;
      stringQuote = char;
      result += char;
      continue;
    }

    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (
      pendingSpace &&
      result.length > 0 &&
      !/[{:;,>~,(]/.test(result.at(-1) ?? "") &&
      !/[}:;,>~,)]/.test(char)
    ) {
      result += " ";
    }
    pendingSpace = false;
    result += char;
  }

  return result.replace(/\s*([{}:;,>~,])\s*/g, "$1").replace(/;}/g, "}");
};

class CssMinifyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("CssMinifyPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "CssMinifyPlugin",
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        (assets) => {
          for (const assetName of Object.keys(assets)) {
            if (!assetName.endsWith(".css")) {
              continue;
            }

            const asset = compilation.getAsset(assetName);
            if (asset == null) {
              continue;
            }

            const originalCss = asset.source.source().toString();
            const minifiedCss = minifyCss(originalCss);
            compilation.updateAsset(
              assetName,
              new sources.RawSource(minifiedCss),
            );
          }
        },
      );
    });
  }
}

/** @type {import('webpack').Configuration} */
const config = {
  cache: {
    type: "filesystem",
  },
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
      _resolve(SRC_PATH, "./index.css"),
      _resolve(SRC_PATH, "./buildinfo.ts"),
      _resolve(SRC_PATH, "./index.tsx"),
    ],
  },
  mode: "production",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: "esbuild-loader",
        options: {
          target: "chrome140",
          tsconfig: "tsconfig.json",
        },
        resolve: {
          fullySpecified: false,
        },
        test: /\.[jt]sx?$/,
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
    new ProvidePlugin({
      AudioContext: ["standardized-audio-context", "AudioContext"],
      Buffer: ["buffer", "Buffer"],
    }),
    new EnvironmentPlugin({
      BUILD_DATE: new Date().toISOString(),
      // Heroku では SOURCE_VERSION 環境変数から commit hash を参照できます
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/[name].css",
    }),
    new CssMinifyPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: _resolve(__dirname, "node_modules/katex/dist/fonts"),
          to: _resolve(DIST_PATH, "styles/fonts"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      inject: "head",
      scriptLoading: "defer",
      template: _resolve(SRC_PATH, "./index.html"),
    }),
    new webpackBundleAnalyzer.BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE ? "server" : "disabled",
      openAnalyzer: false,
    }),
  ],
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
      chunks: "all",
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
          name: "vendor-react",
          chunks: "initial",
          priority: 20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
          priority: 10,
          reuseExistingChunk: true,
          minSize: 20000,
        },
      },
    },
    concatenateModules: true,
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
};

export default config;
