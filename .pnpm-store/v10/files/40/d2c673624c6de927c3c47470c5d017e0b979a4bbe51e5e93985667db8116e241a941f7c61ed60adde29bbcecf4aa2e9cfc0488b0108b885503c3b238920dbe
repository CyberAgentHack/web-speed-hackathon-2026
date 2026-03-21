[![Node](https://img.shields.io/badge/-Node.js-808080?logo=node.js&colorA=404040&logoColor=66cc33)](https://www.npmjs.com/package/set-error-props)
[![Browsers](https://img.shields.io/badge/-Browsers-808080?logo=firefox&colorA=404040)](https://unpkg.com/set-error-props?module)
[![TypeScript](https://img.shields.io/badge/-Typed-808080?logo=typescript&colorA=404040&logoColor=0096ff)](/src/main.d.ts)
[![Codecov](https://img.shields.io/badge/-Tested%20100%25-808080?logo=codecov&colorA=404040)](https://codecov.io/gh/ehmicky/set-error-props)
[![Minified size](https://img.shields.io/bundlephobia/minzip/set-error-props?label&colorA=404040&colorB=808080&logo=webpack)](https://bundlephobia.com/package/set-error-props)
[![Mastodon](https://img.shields.io/badge/-Mastodon-808080.svg?logo=mastodon&colorA=404040&logoColor=9590F9)](https://fosstodon.org/@ehmicky)
[![Medium](https://img.shields.io/badge/-Medium-808080.svg?logo=medium&colorA=404040)](https://medium.com/@ehmicky)

Properly update an error's properties.

# Features

- Prevents overriding [error core properties](#error-core-properties) (`name`,
  `message`, etc.)
- Protects against [prototype pollution](#prototype-pollution)
- Prevents overriding [existing properties](#overriding-protection)
- [Copies](#error-copy) another error's properties
- Can set properties as [non-enumerable](#non-enumerable-properties)
- Preserves properties [descriptors](#descriptors) (`enumerable`, `writable`,
  `configurable`, `get`/`set`)
- [Exception-safe](#exception-safety): this only throws syntax errors
- Strict [TypeScript typing](/src/main.d.ts) of the return value

# Example

```js
import setErrorProps from 'set-error-props'

const error = new Error('one')
setErrorProps(error, { prop: true, message: 'two' })
console.log(error.prop) // true
console.log(error.message) // 'one': message is readonly
```

# Install

```bash
npm install set-error-props
```

This package works in both Node.js >=18.18.0 and
[browsers](https://raw.githubusercontent.com/ehmicky/dev-tasks/main/src/browserslist).

This is an ES module. It must be loaded using
[an `import` or `import()` statement](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c),
not `require()`. If TypeScript is used, it must be configured to
[output ES modules](https://www.typescriptlang.org/docs/handbook/esm-node.html),
not CommonJS.

# API

## setErrorProps(error, props, options?)

`error` `Error | object`\
`props` `Error | object`\
`options` [`Options?`](#options)\
_Return value_: `Error`

Assigns `props` to `error`, then returns `error`.

### Options

#### soft

_Type_: `boolean`\
_Default_: `false`

Prevents [overriding](#overriding-protection) existing properties.

# Usage

## Error core properties

```js
const error = new Error('one')
setErrorProps(error, { message: 'two' })
console.log(error.message) // 'one'
```

## Prototype pollution

```js
const error = new Error('one')
setErrorProps(error, { toString: () => 'injected' })
console.log(error.toString()) // 'Error: one'
console.log(Error.prototype.toString()) // 'Error'
```

## Overriding protection

```js
const error = new Error('message')
error.one = true
setErrorProps(error, { one: false, two: true }, { soft: true })
console.log(error.one) // true
console.log(error.two) // true
```

## Error copy

<!-- eslint-disable fp/no-mutation -->

```js
const error = new Error('one')
const secondError = new Error('two')
secondError.prop = true
setErrorProps(error, secondError)
console.log(error.message) // 'one'
console.log(error.prop) // true
```

## Non-enumerable properties

<!-- eslint-disable fp/no-mutation, no-underscore-dangle -->

```js
const error = new Error('message')

// Properties that start with `_` are not enumerable
setErrorProps(error, { _one: true, two: true })

console.log(error._one) // true
console.log(error.two) // true
console.log(Object.keys(error)) // ['two']
console.log(error) // Prints `two` but not `_one`
```

## Descriptors

<!-- eslint-disable fp/no-mutating-methods, fp/no-let, fp/no-mutation -->

```js
const error = new Error('message')
Object.defineProperty(error, 'prop', {
  value: false,
  enumerable: false,
  writable: true,
  configurable: true,
})
setErrorProps(error, { prop: true })
console.log(error.prop) // true
console.log(Object.getOwnPropertyDescriptor(error, 'prop').enumerable) // false
```

## Exception safety

<!-- eslint-disable fp/no-proxy -->

```js
const error = new Proxy(new Error('message'), {
  set: () => {
    throw new Error('example')
  },
  defineProperty: () => {
    throw new Error('example')
  },
})
setErrorProps(error, { prop: true }) // This does not throw
```

# Related projects

- [`modern-errors`](https://github.com/ehmicky/modern-errors): Handle errors in
  a simple, stable, consistent way
- [`error-custom-class`](https://github.com/ehmicky/error-custom-class): Create
  one error class
- [`error-class-utils`](https://github.com/ehmicky/error-class-utils): Utilities
  to properly create error classes
- [`error-serializer`](https://github.com/ehmicky/error-serializer): Convert
  errors to/from plain objects
- [`normalize-exception`](https://github.com/ehmicky/normalize-exception):
  Normalize exceptions/errors
- [`is-error-instance`](https://github.com/ehmicky/is-error-instance): Check if
  a value is an `Error` instance
- [`set-error-class`](https://github.com/ehmicky/set-error-class): Properly
  update an error's class
- [`set-error-message`](https://github.com/ehmicky/set-error-message): Properly
  update an error's message
- [`wrap-error-message`](https://github.com/ehmicky/wrap-error-message):
  Properly wrap an error's message
- [`set-error-stack`](https://github.com/ehmicky/set-error-stack): Properly
  update an error's stack
- [`merge-error-cause`](https://github.com/ehmicky/merge-error-cause): Merge an
  error with its `cause`
- [`error-cause-polyfill`](https://github.com/ehmicky/error-cause-polyfill):
  Polyfill `error.cause`
- [`handle-cli-error`](https://github.com/ehmicky/handle-cli-error): 💣 Error
  handler for CLI applications 💥
- [`log-process-errors`](https://github.com/ehmicky/log-process-errors): Show
  some ❤ to Node.js process errors
- [`error-http-response`](https://github.com/ehmicky/error-http-response):
  Create HTTP error responses
- [`winston-error-format`](https://github.com/ehmicky/winston-error-format): Log
  errors with Winston

# Support

For any question, _don't hesitate_ to [submit an issue on GitHub](../../issues).

Everyone is welcome regardless of personal background. We enforce a
[Code of conduct](CODE_OF_CONDUCT.md) in order to promote a positive and
inclusive environment.

# Contributing

This project was made with ❤️. The simplest way to give back is by starring and
sharing it online.

If the documentation is unclear or has a typo, please click on the page's `Edit`
button (pencil icon) and suggest a correction.

If you would like to help us fix a bug or add a new feature, please check our
[guidelines](CONTRIBUTING.md). Pull requests are welcome!

<!-- Thanks go to our wonderful contributors: -->

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore -->
<!--
<table><tr><td align="center"><a href="https://fosstodon.org/@ehmicky"><img src="https://avatars2.githubusercontent.com/u/8136211?v=4" width="100px;" alt="ehmicky"/><br /><sub><b>ehmicky</b></sub></a><br /><a href="https://github.com/ehmicky/set-error-props/commits?author=ehmicky" title="Code">💻</a> <a href="#design-ehmicky" title="Design">🎨</a> <a href="#ideas-ehmicky" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/set-error-props/commits?author=ehmicky" title="Documentation">📖</a></td></tr></table>
 -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
