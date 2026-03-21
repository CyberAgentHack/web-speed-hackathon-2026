module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "last 1 Chrome version",
        modules: false,
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
};
