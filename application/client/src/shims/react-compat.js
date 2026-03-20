const preactCompat = require('preact/compat');

// React.use() polyfill for preact/compat
// React Router v7 and react-helmet use use(context) to read context values
function use(resource) {
  // preact createContext returns a FUNCTION (not object), so check both
  if (resource != null && (typeof resource === 'object' || typeof resource === 'function')) {
    // Preact/React context: has Provider and Consumer
    if ('Provider' in resource && 'Consumer' in resource) {
      return preactCompat.useContext(resource);
    }
    // Thenable (Promise): throw to trigger Suspense
    if (typeof resource.then === 'function') {
      throw resource;
    }
  }
  return resource;
}

module.exports = { ...preactCompat, use };
