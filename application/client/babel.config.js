module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "119",
          edge: "119",
          firefox: "119",
          safari: "17",
        },
        corejs: "3",
        modules: false,
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
