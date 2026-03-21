module.exports = (api) => {
  const isProduction = api.env("production");

  return {
    presets: [
      ["@babel/preset-typescript"],
      [
        "@babel/preset-env",
        {
          modules: false,
          targets: {
            chrome: "133",
          },
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
};
