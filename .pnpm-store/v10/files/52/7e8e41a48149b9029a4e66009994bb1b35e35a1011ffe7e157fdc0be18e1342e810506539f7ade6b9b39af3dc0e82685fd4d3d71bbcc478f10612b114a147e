/**
 * `set-error-props` options
 */
export interface Options {
  /**
   * Prevents overriding existing properties.
   *
   * @default false
   *
   * @example
   * ```js
   * const error = new Error('message')
   * error.one = true
   * setErrorProps(error, { one: false, two: true }, { soft: true })
   * console.log(error.one) // true
   * console.log(error.two) // true
   * ```
   */
  readonly soft?: boolean
}

type MergeObjects<Low extends object, High extends object> = High &
  Omit<Low, keyof High>

type CoreErrorProps =
  | 'name'
  | 'message'
  | 'stack'
  | 'cause'
  | 'error'
  | 'constructor'
  | 'toString'
  | 'hasOwnProperty'
  | 'isPrototypeOf'
  | 'propertyIsEnumerable'
  | 'valueOf'
  | 'toLocaleString'

/**
 * Assigns `props` to `error`.
 *
 * @example
 * ```js
 * const error = new Error('message')
 * error.prop = { one: [true] }
 * setErrorProps(error, { prop: { one: [false], two: true } })
 * console.log(error.prop) // { one: [true, false], two: true }
 * ```
 */
export default function setErrorProps<
  ErrorArg extends object,
  Props extends object,
  OptionsArg extends Options,
>(
  error: ErrorArg,
  props: Props,
  options?: OptionsArg,
): Pick<ErrorArg, CoreErrorProps & keyof ErrorArg> &
  Omit<
    OptionsArg['soft'] extends true
      ? MergeObjects<Props, ErrorArg>
      : MergeObjects<ErrorArg, Props>,
    CoreErrorProps
  >
