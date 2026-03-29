module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "chrome >= 90, edge >= 90, firefox >= 88, safari >= 15",
        corejs: "3",
        modules: false,
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: false,
        runtime: "automatic",
      },
    ],
  ],
};
