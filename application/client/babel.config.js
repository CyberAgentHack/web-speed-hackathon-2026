module.exports = {
  presets: [
    ['@babel/preset-typescript'],
    [
      '@babel/preset-react',
      {
        development: true,
        runtime: 'automatic',
      },
    ],
  ],
};
