module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "defaults",
        modules: false,
        useBuiltIns: false,
        exclude: ["proposal-dynamic-import"],
      },
    ],
    [
      "@babel/preset-react",
      {
        // development: true,
        runtime: "automatic",
      },
    ],
  ],
};
