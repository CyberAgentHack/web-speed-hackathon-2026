const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "120",
        },
        useBuiltIns: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        development: !isProduction,
        runtime: "automatic",
      },
    ],
  ],
};
