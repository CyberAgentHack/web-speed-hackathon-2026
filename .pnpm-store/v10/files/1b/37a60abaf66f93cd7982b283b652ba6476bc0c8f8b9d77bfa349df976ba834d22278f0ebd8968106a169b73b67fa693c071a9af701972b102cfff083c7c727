type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error

/**
 * Sets `error.message = newMessage`.
 *
 * Returns `error`. If `error` is not an `Error` in
 * stance, it is converted to one.
 *
 * @example
 * ```js
 * const error = new Error('one')
 * console.log(error.message) // 'one'
 * console.log(error.stack) // 'Error: one ...'
 *
 * setErrorMessage(error, 'two')
 * console.log(error.message) // 'two'
 * console.log(error.stack) // 'Error: two ...'
 * ```
 */
export default function setErrorMessage<ErrorArg>(
  error: ErrorArg,
  newMessage: string,
): NormalizeError<ErrorArg>
