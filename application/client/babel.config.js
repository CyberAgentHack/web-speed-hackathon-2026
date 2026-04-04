module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        bugfixes: true,
        modules: false,
        targets: { chrome: "120" },
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
