# Webpack Chunk Loading Notes

## Purpose

`ffmpeg` / `imagemagick` / `web-llm` are configured as dedicated async chunk groups in
`application/client/webpack.config.js`.

The goal is:

- keep these heavy libraries out of the initial entrypoint when possible
- load them only when the related UI action actually needs them
- make it easier to identify and remove generated server assets during deploys

## Dedicated Chunk Groups

Webpack `splitChunks.cacheGroups` defines these async-only groups:

- `vendor-ffmpeg`
- `vendor-imagemagick`
- `vendor-web-llm`

The fallback `vendor` and `vendor-react` groups are limited to `chunks: "initial"` so async
dependencies do not get pulled back into the initial entrypoint.

These names are logical chunk group names. The emitted files may still be split into multiple
hashed files because `maxSize` is enabled.

## How To Verify

Run:

```sh
cd application/client
pnpm run build:analyze
```

Then inspect:

- `application/dist/bundle-report.html`
- `application/dist/bundle-stats.json`

What to check:

- the heavy libraries are no longer listed under `Entrypoint main`
- the related chunks are `initial: false`
- the code path references them via `import()`

## Server Asset Handling

Generated client assets are emitted under:

- `application/dist/scripts`
- `application/dist/styles`

Recommended deploy behavior:

- treat `application/dist` as fully generated output
- delete and replace the whole directory on deploy instead of deleting chunk files manually

Reason:

- chunk filenames are hashed and may change every build
- one logical chunk group can emit multiple files
- stale files are easy to leave behind if you delete per filename

If manual cleanup is ever necessary, identify the current files from:

- `application/dist/index.html`
- `application/dist/bundle-stats.json`

Do not assume a fixed filename like `vendor-web-llm.js` will always exist.
