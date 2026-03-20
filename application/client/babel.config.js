const isProd = process.env.NODE_ENV === "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: isProd ? "last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions" : "last 1 Chrome version",
        modules: false,
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        development: !isProd,
        runtime: "automatic",
      },
    ],
  ],
};
