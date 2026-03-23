module.exports = function toPath(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [value];
  var result = [];
  var rePropName = /[^.[\]]+|\[(?:([^"'][^[]*)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  value.replace(rePropName, function(match, expr, quote, str) {
    result.push(quote ? str.replace(/\\(\\)?/g, '$1') : (expr || match));
  });
  return result;
};
