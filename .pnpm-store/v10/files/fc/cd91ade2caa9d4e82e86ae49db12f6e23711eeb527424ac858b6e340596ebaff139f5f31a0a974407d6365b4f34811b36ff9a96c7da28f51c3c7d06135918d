[![Node](https://img.shields.io/badge/-Node.js-808080?logo=node.js&colorA=404040&logoColor=66cc33)](https://www.npmjs.com/package/redefine-property)
[![Browsers](https://img.shields.io/badge/-Browsers-808080?logo=firefox&colorA=404040)](https://unpkg.com/redefine-property?module)
[![TypeScript](https://img.shields.io/badge/-Typed-808080?logo=typescript&colorA=404040&logoColor=0096ff)](/src/main.d.ts)
[![Codecov](https://img.shields.io/badge/-Tested%20100%25-808080?logo=codecov&colorA=404040)](https://codecov.io/gh/ehmicky/redefine-property)
[![Minified size](https://img.shields.io/bundlephobia/minzip/redefine-property?label&colorA=404040&colorB=808080&logo=webpack)](https://bundlephobia.com/package/redefine-property)
[![Mastodon](https://img.shields.io/badge/-Mastodon-808080.svg?logo=mastodon&colorA=404040&logoColor=9590F9)](https://fosstodon.org/@ehmicky)
[![Medium](https://img.shields.io/badge/-Medium-808080.svg?logo=medium&colorA=404040)](https://medium.com/@ehmicky)

Better `Object.defineProperty()`.

# Features

This is identical to
[`Object.defineProperty()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
except:

- The [default value](#default-values) of `enumerable`, `writable` and
  `configurable` is `true`
- If the property already exists, its descriptors are
  [used as default](#keep-previous-descriptor), even if the property is
  [inherited](#keep-inherited-descriptor)
- Invalid arguments throw with a [clear error message](#better-validation)
- Otherwise, this [never throws](#exception-safety)

# Example

```js
import redefineProperty from 'redefine-property'

const object = redefineProperty({}, 'prop', { value: 0, enumerable: false })
console.log(Object.getOwnPropertyDescriptor(object, 'prop'))
// {
//   value: 0,
//   enumerable: false,
//   writable: true,
//   configurable: true,
// }
```

# Install

```bash
npm install redefine-property
```

This package works in both Node.js >=18.18.0 and
[browsers](https://raw.githubusercontent.com/ehmicky/dev-tasks/main/src/browserslist).

This is an ES module. It must be loaded using
[an `import` or `import()` statement](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c),
not `require()`. If TypeScript is used, it must be configured to
[output ES modules](https://www.typescriptlang.org/docs/handbook/esm-node.html),
not CommonJS.

# API

## redefineProperty(value, key, descriptor)

`value` `object`\
`key` `string | symbol | number`\
`descriptor` `PropertyDescriptor`\
_Return value_: `value`

Like
[`Object.defineProperty(...)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
but with some [additional features](#features).

# Usage

## Default values

<!-- eslint-disable fp/no-mutating-methods -->

```js
const object = redefineProperty({}, 'prop', { value: 0 })
console.log(Object.getOwnPropertyDescriptor(object, 'prop'))
// {
//   value: 0,
//   enumerable: true,
//   writable: true,
//   configurable: true,
// }

const otherObject = Object.defineProperty({}, 'prop', { value: 0 })
console.log(Object.getOwnPropertyDescriptor(otherObject, 'prop'))
// {
//   value: 0,
//   enumerable: false,
//   writable: false,
//   configurable: false,
// }
```

## Keep previous descriptor

```js
const object = redefineProperty({}, 'prop', {
  value: 0,
  enumerable: false,
  writable: true,
  configurable: true,
})
redefineProperty(object, 'prop', { value: 1, configurable: false })
console.log(Object.getOwnPropertyDescriptor(object, 'prop'))
// {
//   value: 1,
//   enumerable: false,
//   writable: true,
//   configurable: false,
// }
```

## Keep inherited descriptor

<!-- eslint-disable fp/no-class, fp/no-mutating-methods -->

```js
class CustomError extends Error {}
redefineProperty(CustomError.prototype, 'name', {
  value: 'CustomError',
  enumerable: false,
})

const error = new CustomError('')
redefineProperty(error, 'name', { value: 'ExampleError' })
console.log(Object.getOwnPropertyDescriptor(error, 'name'))
// {
//   value: 'ExampleError',
//   enumerable: false,
//   writable: true,
//   configurable: true,
// }

const otherError = new CustomError('')
Object.defineProperty(otherError, 'name', { value: 'ExampleError' })
console.log(Object.getOwnPropertyDescriptor(otherError, 'name'))
// {
//   value: 'ExampleError',
//   enumerable: false,
//   writable: false,
//   configurable: false,
// }
```

## Better validation

<!-- eslint-disable fp/no-mutating-methods -->

```js
Object.defineProperty({}, true, { value: 0 }) // This does not throw
redefineProperty({}, true, { value: 0 }) // This throws
```

## Exception safety

<!-- eslint-disable fp/no-proxy, fp/no-mutating-methods -->

```js
const object = new Proxy(
  {},
  {
    defineProperty: () => {
      throw new Error('example')
    },
  },
)

redefineProperty(object, 'prop', { value: 1 }) // This does not throw
Object.defineProperty(object, 'prop', { value: 1 }) // This throws
```

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
<table><tr><td align="center"><a href="https://fosstodon.org/@ehmicky"><img src="https://avatars2.githubusercontent.com/u/8136211?v=4" width="100px;" alt="ehmicky"/><br /><sub><b>ehmicky</b></sub></a><br /><a href="https://github.com/ehmicky/redefine-property/commits?author=ehmicky" title="Code">💻</a> <a href="#design-ehmicky" title="Design">🎨</a> <a href="#ideas-ehmicky" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/ehmicky/redefine-property/commits?author=ehmicky" title="Documentation">📖</a></td></tr></table>
 -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
