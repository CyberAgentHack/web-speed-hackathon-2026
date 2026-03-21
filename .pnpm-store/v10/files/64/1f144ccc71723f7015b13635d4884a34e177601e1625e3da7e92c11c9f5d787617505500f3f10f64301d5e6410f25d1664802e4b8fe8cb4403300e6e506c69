import type setErrorProps from 'set-error-props'

type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error

type SetErrorProps<ErrorArg extends object, Cause extends object> = ReturnType<
  typeof setErrorProps<ErrorArg, Cause, { soft: true }>
>

type MergeErrorCause<ErrorArg> = 'cause' extends keyof ErrorArg
  ? Omit<
      ErrorArg['cause'] extends object
        ? SetErrorProps<NormalizeError<ErrorArg>, ErrorArg['cause']>
        : NormalizeError<ErrorArg>,
      'cause'
    > &
      Error
  : NormalizeError<ErrorArg>

/**
 * This merges
 * [`error.cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
 * recursively with its parent `error`, including its
 * [`message`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/message),
 * [`stack`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack),
 * [`name`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name)
 * and
 * [`errors`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError).
 *
 * `error` is modified and returned.
 *
 * If `error`'s class is `Error` or if `error.wrap` is `true`,
 * [`error.cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
 * is modified and returned instead.
 *
 * If `error` is not a valid `Error`, a new `error` is created and returned
 * instead.
 *
 * This never throws.
 *
 * @example
 * ```js
 * const main = (userId) => {
 *   try {
 *     return createUser(userId)
 *   } catch (error) {
 *     throw mergeErrorCause(error)
 *     // Printed as:
 *     //   TypeError: Invalid user id: false
 *     //   Could not create user.
 *   }
 * }
 *
 * const createUser = (userId) => {
 *   try {
 *     validateUserId(userId)
 *     return sendDatabaseRequest('create', userId)
 *   } catch (cause) {
 *     throw new Error('Could not create user.', { cause })
 *   }
 * }
 *
 * const validateUserId = (userId) => {
 *   if (typeof userId !== 'string') {
 *     throw new TypeError(`Invalid user id: ${userId}.`)
 *   }
 * }
 *
 * main(false)
 * ```
 */
export default function mergeErrorCause<ErrorArg>(
  error: ErrorArg,
): MergeErrorCause<ErrorArg>
