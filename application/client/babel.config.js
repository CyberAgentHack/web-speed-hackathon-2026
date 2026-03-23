module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "defaults, not ie 11, not dead",
        modules: false,
        useBuiltIns: false,
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
