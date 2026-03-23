type NormalizeError<ErrorArg> = ErrorArg extends Error ? ErrorArg : Error

/**
 * Appends `message` to `error.message`. If `message` ends with `:` or `:\n`,
 * prepends it instead.
 *
 * Returns `error`. If `error` is not an `Error` instance, it is converted to
 * one.
 *
 * @example
 * ```js
 * wrapErrorMessage(new Error('Message.'), 'Additional message.')
 * // Error: Message.
 * // Additional message.
 *
 * wrapErrorMessage(new Error('Message.'), 'Additional message:')
 * // Error: Additional message: Message.
 *
 * wrapErrorMessage(new Error('Message.'), 'Additional message:\n')
 * // Error: Additional message:
 * // Message.
 *
 * wrapErrorMessage(new Error('Message.'), '')
 * // Error: Message.
 *
 * const invalidError = 'Message.'
 * wrapErrorMessage(invalidError, 'Additional message.')
 * // Error: Message.
 * // Additional message.
 *
 * wrapErrorMessage(new Error('  Message with spaces  '), '  Additional message  ')
 * // Error: Message with spaces
 * // Additional message
 * ```
 */
export default function wrapErrorMessage<ErrorArg>(
  error: ErrorArg,
  newMessage: string,
): NormalizeError<ErrorArg>
