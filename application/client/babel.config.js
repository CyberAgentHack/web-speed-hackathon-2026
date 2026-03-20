module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "> 0.5%, last 2 versions, not dead",
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
