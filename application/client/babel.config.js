module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "ie 11",
        modules: "commonjs",
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
