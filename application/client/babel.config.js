module.exports = function (api) {
  const prod = api.env("production");
  api.cache(true);

  return {
    presets: [
      ["@babel/preset-typescript"],
      [
        "@babel/preset-env",
        {
          bugfixes: true,
          modules: false,
          targets: "last 2 Chrome versions",
          useBuiltIns: false,
        },
      ],
      [
        "@babel/preset-react",
        {
          development: !prod,
          runtime: "automatic",
        },
      ],
    ],
  };
};
