module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "ie 11",
        corejs: "3",
        // Keep ESM syntax for webpack to preserve import() code splitting.
        modules: false,
        useBuiltIns: "usage",
      },
    ],
    [
      "@babel/preset-react",
      {
        development: process.env.NODE_ENV === "development",
        runtime: "automatic",
      },
    ],
  ],
};
