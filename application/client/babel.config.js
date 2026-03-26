module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        // Lighthouse 採点環境は Chrome 最新版想定なので、古いブラウザ向け変換を減らします
        targets: { chrome: "120" },
        corejs: "3",
        // Webpack の tree-shaking を効かせるため ESM のまま残します
        modules: false,
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        // production ビルドでは jsxDEV を出さない
        development: false,
        runtime: "automatic",
      },
    ],
  ],
};
