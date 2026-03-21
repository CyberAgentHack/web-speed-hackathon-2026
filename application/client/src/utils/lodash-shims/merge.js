function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function baseMerge(target, source) {
  if (!isObject(target) || !isObject(source)) return source;
  var keys = Object.keys(source);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var srcVal = source[key];
    var tgtVal = target[key];
    if (isObject(srcVal) && isObject(tgtVal)) {
      target[key] = baseMerge(tgtVal, srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

module.exports = function merge(target) {
  for (var i = 1; i < arguments.length; i++) {
    baseMerge(target, arguments[i]);
  }
  return target;
};
