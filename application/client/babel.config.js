const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        // 本番はレギュレーションどおり最新 Chrome 想定。modules:false で webpack が import() 分割できるようにする
        targets: isProduction ? { chrome: "120" } : "ie 11",
        corejs: "3",
        modules: isProduction ? false : "commonjs",
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        development: !isProduction,
        runtime: "automatic",
      },
    ],
  ],
};
