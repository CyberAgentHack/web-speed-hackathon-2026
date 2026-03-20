module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "last 1 year",
        corejs: "3",
        modules: false,
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: process.env.NODE_ENV !== "production",
        runtime: "automatic",
      },
    ],
  ],
};
