const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        bugfixes: true,
        modules: false,
        targets: "last 1 Chrome major version",
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
