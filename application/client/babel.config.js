module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        // Only support the latest Chrome to minimize transpilation output.
        targets: "last 1 Chrome version",
        bugfixes: true,
        modules: false,
        useBuiltIns: false,
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
