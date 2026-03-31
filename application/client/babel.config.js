module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "defaults, not dead",
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
