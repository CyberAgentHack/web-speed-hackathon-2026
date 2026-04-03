module.exports = (api) => {
  api.cache(true);

  return {
    presets: [
      ["@babel/preset-typescript"],
      [
        "@babel/preset-env",
        {
          targets: {
            chrome: "120",
          },
          corejs: "3",
          modules: false,
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
