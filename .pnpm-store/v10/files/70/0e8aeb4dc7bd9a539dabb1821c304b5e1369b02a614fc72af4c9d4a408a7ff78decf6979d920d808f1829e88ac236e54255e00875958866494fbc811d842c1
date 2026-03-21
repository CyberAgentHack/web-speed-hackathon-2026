[![Node](https://img.shields.io/badge/-Node.js-808080?logo=node.js&colorA=404040&logoColor=66cc33)](https://www.npmjs.com/package/normalize-exception)
[![Browsers](https://img.shields.io/badge/-Browsers-808080?logo=firefox&colorA=404040)](https://unpkg.com/normalize-exception?module)
[![TypeScript](https://img.shields.io/badge/-Typed-808080?logo=typescript&colorA=404040&logoColor=0096ff)](/src/main.d.ts)
[![Codecov](https://img.shields.io/badge/-Tested%20100%25-808080?logo=codecov&colorA=404040)](https://codecov.io/gh/ehmicky/normalize-exception)
[![Minified size](https://img.shields.io/bundlephobia/minzip/normalize-exception?label&colorA=404040&colorB=808080&logo=webpack)](https://bundlephobia.com/package/normalize-exception)
[![Mastodon](https://img.shields.io/badge/-Mastodon-808080.svg?logo=mastodon&colorA=404040&logoColor=9590F9)](https://fosstodon.org/@ehmicky)
[![Medium](https://img.shields.io/badge/-Medium-808080.svg?logo=medium&colorA=404040)](https://medium.com/@ehmicky)

Normalize:

- Exceptions that are [not `Error` instances](#invalid-type)
- Error properties (`name`, `message`, `stack`, `constructor`) that are
  [missing](#missing-properties), [invalid](#invalid-properties),
  [enumerable](#enumerable-properties), [readonly](#readonly-properties),
  [non-writable](#non-writable-properties),
  [non-configurable](#non-configurable-properties),
  [non-extensible](#non-extensible-error), [proxied](#proxies) or
  [throwing](#throwing-properties)
- [`error.cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
  and
  [`error.errors`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)
  [recursively](#recursion), when present

# Example

<!-- eslint-disable no-throw-literal -->

```js
import normalizeException from 'normalize-exception'

try {
  throw 'message'
} catch (error) {
  console.log(error) // 'message'
  console.log(normalizeException(error)) // Error: message
  console.log(normalizeException(error) instanceof Error) // true
}
```

# Install

```bash
npm install normalize-exception
```

This package works in both Node.js >=18.18.0 and
[browsers](https://raw.githubusercontent.com/ehmicky/dev-tasks/main/src/browserslist).

This is an ES module. It must be loaded using
[an `import` or `import()` statement](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c),
not `require()`. If TypeScript is used, it must be configured to
[output ES modules](https://www.typescriptlang.org/docs/handbook/esm-node.html),
not CommonJS.

# API

## normalizeException(error, options?)

`error` `any`\
`options` [`Options`](#options)\
_Return value_: `Error`

`normalizeException()` never throws.

If `error` is an `Error` instance, it is returned. Any missing or invalid error
property is directly modified.

If it is not an `Error` instance, a new one is created and returned.

### Options

Options are an optional object with the following properties.

#### shallow

_Type_: `boolean`\
_Default_: `false`

Unless `true`,
[`error.cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
and
[`error.errors`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError)
are normalized [recursively](#recursion), when present.

# Features

## Invalid type

### Strings

<!-- eslint-disable no-throw-literal -->

```js
try {
  throw 'message'
} catch (error) {
  console.log(error) // 'message'
  console.log(normalizeException(error)) // Error: message
  console.log(normalizeException(error) instanceof Error) // true
}
```

### Plain objects

<!-- eslint-disable no-throw-literal -->

```js
try {
  throw { name: 'TypeError', message: 'message' }
} catch (error) {
  console.log(normalizeException(error)) // TypeError: message
}
```

### Others

<!-- eslint-disable unicorn/no-null, no-throw-literal -->

```js
try {
  throw null
} catch (error) {
  console.log(error.message) // Throws
  console.log(normalizeException(error).message) // 'null'
}
```

## Missing properties

```js
try {
  const error = new TypeError('message')
  error.name = undefined
  throw error
} catch (error) {
  console.log(error.name) // undefined
  console.log(normalizeException(error).name) // 'TypeError'
}
```

## Mismatched constructor

<!-- eslint-disable fp/no-delete -->

```js
try {
  const error = new TypeError('message')
  error.constructor = RangeError
  throw error
} catch (error) {
  console.log(error.constructor) // RangeError
  console.log(normalizeException(error).constructor) // TypeError
}
```

## Missing stack

```js
try {
  const error = new Error('message')
  error.stack = undefined
  throw error
} catch (error) {
  console.log(error.stack) // undefined
  console.log(normalizeException(error).stack) // 'Error: message ...'
}
```

## Invalid properties

```js
try {
  const error = new Error('message')
  error.message = true
  throw error
} catch (error) {
  console.log(typeof error.message) // 'boolean'
  console.log(typeof normalizeException(error).message) // 'string'
}
```

## Enumerable properties

<!-- eslint-disable fp/no-class, fp/no-this, fp/no-mutation -->

```js
class ExampleError extends Error {
  constructor(...args) {
    super(...args)
    // Common mistake: this makes `error.name` enumerable
    this.name = 'ExampleError'
  }
}

try {
  throw new ExampleError('message')
} catch (error) {
  console.log({ ...error }) // { name: 'ExampleError' }
  console.log({ ...normalizeException(error) }) // {}
}
```

## Readonly properties

<!-- eslint-disable fp/no-mutating-methods, fp/no-get-set, fp/no-mutation -->

```js
try {
  const error = new Error('message')
  Object.defineProperty(error, 'message', { get: () => 'message' })
  throw error
} catch (error) {
  error.message = 'other' // Throws
  normalizeException(error).message = 'other' // Does not throw
}
```

## Non-writable properties

<!-- eslint-disable fp/no-mutating-methods, fp/no-mutation -->

```js
try {
  const error = new Error('message')
  Object.defineProperty(error, 'message', { value: '', writable: false })
  throw error
} catch (error) {
  error.message = 'other' // Throws
  normalizeException(error).message = 'other' // Does not throw
}
```

## Non-configurable properties

<!-- eslint-disable fp/no-mutating-methods, fp/no-delete -->

```js
try {
  const error = new Error('message')
  Object.defineProperty(error, 'message', { value: '', configurable: false })
  throw error
} catch (error) {
  delete error.message // Throws
  delete normalizeException(error).message // Does not throw
}
```

## Non-extensible error

<!-- eslint-disable fp/no-mutation -->

```js
try {
  const error = new Error('message')
  Object.preventExtensions(error)
  throw error
} catch (error) {
  error.prop = true // Throws
  normalizeException(error).prop = true // Does not throw
}
```

## Proxies

<!-- eslint-disable fp/no-proxy, no-shadow -->

```js
try {
  throw new Proxy(new Error('message'), {})
} catch (error) {
  const { toString } = Object.prototype
  console.log(toString.call(error)) // '[object Object]'
  console.log(toString.call(normalizeException(error))) // '[object Error]'
}
```

## Throwing properties

### Proxies

<!-- eslint-disable fp/no-proxy, no-shadow -->

```js
try {
  throw new Proxy(new Error('message'), {
    get: () => {
      throw new Error('example')
    },
  })
} catch (error) {
  console.log(error.message) // Throws
  console.log(normalizeException(error).message) // Does not throw
}
```

### Getters

<!-- eslint-disable fp/no-mutating-methods, fp/no-get-set -->

```js
try {
  const error = new Error('message')
  Object.defineProperty(error, 'message', {
    get: () => {
      throw new Error('example')
    },
  })
  throw error
} catch (error) {
  console.log(error.message) // Throws
  console.log(normalizeException(error).message) // Does not throw
}
```

## Recursion

### `error.cause`

```js
try {
  throw new Error('message', { cause: 'innerError' })
} catch (error) {
  console.log(error.cause instanceof Error) // false
  console.log(normalizeException(error).cause instanceof Error) // true
}
```

### `error.errors`

```js
try {
  throw new AggregateError(['innerError'], 'message')
} catch (error) {
  console.log(error.errors[0] instanceof Error) // false
  console.log(normalizeException(error).errors[0] instanceof Error) // true
}
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
- [`merge-error-cause`](https://github.com/ehmicky/merge-error-cause): Merge an
  error with its `cause`
- [`is-error-instance`](https://github.com/ehmicky/is-error-instance): Check if
  a value is an `Error` instance
- [`set-error-class`](https://github.com/ehmicky/set-error-class): Properly
  update an error's class
- [`set-error-message`](https://github.com/ehmicky/set-error-message): Properly
  update an error's message
- [`wrap-error-message`](https://github.com/ehmicky/wrap-error-message):
  Properly wrap an error's message
- [`set-error-props`](https://github.com/ehmicky/set-error-props): Properly
  update an error's properties
- [`set-error-stack`](https://github.com/ehmicky/set-error-stack): Properly
  update an error's stack
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
<table><tr><td align="center"><a href="https://fosstodon.org/@ehmicky"><img src="https://avatars2.githubusercontent.com/u/8136211?v=4" width="100px;" alt="ehmicky"/><br /><sub><b>ehmicky</b></sub></a><br /><a href="https://github.com/ehmicky/normalize-exception/commits?author=ehmicky" title="Code">💻</a> <a href="#design-ehmicky" title="Design">🎨</a> <a href="#ideas-ehmicky" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/normalize-exception/commits?author=ehmicky" title="Documentation">📖</a></td></tr></table>
 -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
