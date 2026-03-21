function baseIsEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'number' && isNaN(a) && isNaN(b)) return true;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!baseIsEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(b)) return false;

  var keysA = Object.keys(a);
  var keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (var i = 0; i < keysA.length; i++) {
    var key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !baseIsEqual(a[key], b[key])) return false;
  }
  return true;
}

module.exports = baseIsEqual;
