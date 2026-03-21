var toPath = require('./toPath');

module.exports = function get(object, path, defaultValue) {
  var parts = Array.isArray(path) ? path : toPath(path);
  var result = object;
  for (var i = 0; i < parts.length; i++) {
    if (result == null) return defaultValue;
    result = result[parts[i]];
  }
  return result === undefined ? defaultValue : result;
};
