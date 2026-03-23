type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error

/**
 * Sets the `error`'s
 * [prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf),
 * [`name`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name)
 * and
 * [`constructor`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor).
 *
 * @example
 * ```js
 * const typeError = new TypeError('test')
 * console.log(typeError instanceof TypeError) // true
 * console.log(typeError.name) // 'TypeError'
 * console.log(typeError.constructor) // TypeError
 * console.log(typeError.stack) // TypeError: test ...
 *
 * const rangeError = setErrorClass(typeError, RangeError)
 * console.log(rangeError === typeError) // true
 * console.log(rangeError instanceof RangeError) // true
 * console.log(rangeError.name) // 'RangeError'
 * console.log(rangeError.constructor) // RangeError
 * console.log(rangeError.stack) // RangeError: test ...
 * ```
 */
export default function setErrorClass<ErrorArg>(
  error: ErrorArg,
  ErrorClass: new () => unknown,
): NormalizeError<ErrorArg>
