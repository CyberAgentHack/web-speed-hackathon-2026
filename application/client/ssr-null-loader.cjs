/** SSR webpack ビルド用: CSS やバイナリリソースを空モジュールに差し替える */
module.exports = function () {
  return "module.exports = {};";
};
