var isEqual = require('./isEqual');

module.exports = function isEqualWith(a, b, customizer) {
  if (typeof customizer !== 'function') return isEqual(a, b);
  var result = customizer(a, b);
  if (result !== undefined) return !!result;
  return isEqual(a, b);
};
