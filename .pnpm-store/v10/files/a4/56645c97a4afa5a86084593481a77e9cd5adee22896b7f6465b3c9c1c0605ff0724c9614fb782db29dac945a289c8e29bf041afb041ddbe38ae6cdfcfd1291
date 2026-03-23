/**
 * Like
 * [`Object.defineProperty(...)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
 * but with some additional features.
 *
 * @example
 * ```js
 * const object = redefineProperty({}, 'prop', { value: 0, enumerable: false })
 * console.log(Object.getOwnPropertyDescriptor(object, 'prop'))
 * // {
 * //   value: 0,
 * //   enumerable: false,
 * //   writable: true,
 * //   configurable: true,
 * // }
 * ```
 */
export default function redefineProperty<T extends object>(
  object: T,
  key: PropertyKey,
  descriptor: PropertyDescriptor,
): T
