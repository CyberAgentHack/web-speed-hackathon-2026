module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "baseline widely available on 2026-01-01",
        modules: false,
        useBuiltIns: false,
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
