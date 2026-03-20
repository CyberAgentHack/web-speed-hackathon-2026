module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: "defaults",
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
