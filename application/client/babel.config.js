const isDevelopment = process.env.NODE_ENV !== "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "ie 11",
        corejs: "3",
        modules: false,
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        development: isDevelopment,
        runtime: "automatic",
      },
    ],
  ],
};
