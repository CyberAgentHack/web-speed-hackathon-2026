const isDev = process.env.NODE_ENV !== "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: ["last 1 Chrome version"],
        modules: false,
        useBuiltIns: "usage",
        corejs: 3,
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
