module.exports = {
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-react",
      {
        development: process.env.NODE_ENV !== "production",
        runtime: "automatic",
      },
    ],
  ],
};
