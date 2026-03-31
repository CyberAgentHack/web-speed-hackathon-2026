module.exports = (api) => {
  const isProd = api.env("production");

  return {
    presets: [
      ["@babel/preset-typescript"],
      [
        "@babel/preset-env",
        {
          bugfixes: true,
          targets: "last 1 Chrome version",
          modules: false,
        },
      ],
      [
        "@babel/preset-react",
        {
          development: !isProd,
          runtime: "automatic",
        },
      ],
    ],
  };
};
