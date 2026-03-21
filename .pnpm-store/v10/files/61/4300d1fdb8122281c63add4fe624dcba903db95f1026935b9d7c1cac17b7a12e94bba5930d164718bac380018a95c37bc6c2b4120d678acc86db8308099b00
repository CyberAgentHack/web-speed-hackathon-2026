/**
 * `normalize-exception` options
 */
export interface Options {
  /**
   * Unless `true`,
   * [`error.cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
   * and
   * [`error.errors`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)
   * are normalized recursively, when present.
   */
  readonly shallow?: boolean
}

type DefinedString<Value, DefaultValue> = Value extends string
  ? Value extends ''
    ? DefaultValue
    : Value
  : DefaultValue

type NormalizedError<ErrorArg> = Error &
  (ErrorArg extends Error
    ? {
        name: DefinedString<ErrorArg['name'], Error['constructor']['name']>
        message: DefinedString<ErrorArg['message'], ''>
        stack: DefinedString<ErrorArg['stack'], string>
      }
    : unknown)

/**
 * Normalize exception/error.
 *
 * In JavaScript, one can `throw` any value including strings, objects (like
 * `{ message: "..." }`) or even `undefined`. This normalizes any exception
 * to an `Error` instance.
 *
 * It also fixes any missing or invalid error properties: `name`, `message`,
 * `stack`, `cause`, `errors`.
 *
 * @example
 * ```js
 * import normalizeException from 'normalize-exception'
 *
 * try {
 *   throw null
 * } catch (error) {
 *   const normalizedError = normalizeException(error)
 *   console.log(normalizedError) // Error: null
 *   // Without `normalizeException()`, this would throw
 *   console.log(normalizedError.name)
 * }
 *
 * console.log(normalizeException('message')) // Error: message
 *
 * console.log(normalizeException({ name: 'TypeError', message: 'message' })) // TypeError: message
 *
 * const error = new TypeError('message')
 * console.log(error.stack) // TypeError: message
 *
 * // `error.stack` is cached, so it does not update
 * error.message += ' otherMessage'
 * console.log(error.stack) // TypeError: message
 *
 * const normalizedError = normalizeException(error)
 * console.log(normalizedError.stack) // TypeError: message otherMessage
 *
 * const error = new Error('message', { cause: 'innerError' })
 * console.log(error.cause instanceof Error) // false
 *
 * const normalizedError = normalizeException(error)
 * console.log(normalizedError.cause instanceof Error) // true
 * console.log(normalizedError.cause) // Error: innerError
 * ```
 */
export default function normalizeException<ErrorArg>(
  error: ErrorArg,
  options?: Options,
): NormalizedError<ErrorArg>
