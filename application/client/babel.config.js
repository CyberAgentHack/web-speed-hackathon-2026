module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "ie 11",
        corejs: "3",
        modules: "commonjs",
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: true,
        runtime: "automatic",
      },
    ],
  ],
};
