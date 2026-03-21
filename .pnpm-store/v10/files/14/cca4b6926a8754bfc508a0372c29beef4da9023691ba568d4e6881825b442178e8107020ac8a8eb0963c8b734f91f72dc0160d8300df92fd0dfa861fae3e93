/**
 * Check if a value is an `Error` instance.
 *
 * This is like `value instanceof Error` except it works across realms, such as
 * iframes or Node.js [`vm`](https://nodejs.org/api/vm.html).
 *
 * @example
 * ```js
 * isErrorInstance(new Error('')) // true
 * isErrorInstance('') // false
 *
 * const CrossRealmError = vm.runInNewContext('Error')
 * isErrorInstance(new CrossRealmError('')) // true
 *
 * isErrorInstance(new TypeError('')) // true
 * isErrorInstance(new AnyOtherError('')) // true
 *
 * isErrorInstance(new DOMException('')) // true
 * isErrorInstance(new DOMError('')) // true
 *
 * isErrorInstance(new Proxy(new Error(''), {})) // true
 * isErrorInstance(
 *   new Proxy(new Error(''), {
 *     getPrototypeOf() {
 *       throw new Error('')
 *     },
 *   }),
 * ) // false
 * ```
 */
declare const isErrorInstance: <T>(value: T) => ErrorCheck<T>;
export default isErrorInstance;
type ErrorCheck<T> = T extends Error ? true : false;
