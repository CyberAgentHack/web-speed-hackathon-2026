module.exports = function mapValues(obj, fn) {
  if (obj == null) return {};
  var result = {};
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    result[key] = fn(obj[key], key, obj);
  }
  return result;
};
