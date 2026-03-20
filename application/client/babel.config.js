module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: {"chrome": "145"},
        corejs: "3",
        modules: "commonjs",
        useBuiltIns: false,
      },
      // {
      //   targets: "ie 11",
      //   corejs: "3",
      //   modules: "commonjs",
      //   useBuiltIns: false,
      // },
    ],
    [
      "@babel/preset-react",
      {
        development: false,
        // development: true,
        runtime: "automatic",
      },
    ],
  ],
};
