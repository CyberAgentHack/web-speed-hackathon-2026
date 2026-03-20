module.exports = (api) => {
  api.cache(true);

  return {
    presets: [
      ["@babel/preset-typescript"],
      [
        "@babel/preset-env",
        {
          targets: "ie 11",
          corejs: "3",
          modules: "commonjs",
          useBuiltIns: "usage",
        },
      ],
      [
        "@babel/preset-react",
        {
          development: false,
          runtime: "automatic",
        },
      ],
    ],
  };
};
