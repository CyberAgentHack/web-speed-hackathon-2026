const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: ["last 1 Chrome version"],
        corejs: "3",
        modules: false,
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: isDev,
        runtime: "automatic",
      },
    ],
  ],
};
