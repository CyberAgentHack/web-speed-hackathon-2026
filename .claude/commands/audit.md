Scan the codebase for common Web Speed Hackathon performance traps. Check ALL of the following and report findings grouped by IMPACT (HIGH first):

1. **Webpack config**: Find webpack.config.* files. Check `mode`, `devtool`, `optimization.splitChunks`, any disabled minification
2. **Intentional delays**: Search for `setTimeout`, `sleep`, `delay`, artificial latency in fetch/API calls
3. **Cache headers**: Search server code for `cache-control`, `no-store`, `no-cache` — report if caching is disabled
4. **Huge dependencies**: Check package.json for known heavy libs (ffmpeg, lodash full, moment, luxon, multiple video players like hls.js + shaka + video.js)
5. **Polyfills**: Search for core-js, @babel/polyfill, or polyfills for View Transitions, setImmediate, etc.
6. **Client-side validation bloat**: Check if zod, drizzle, or similar server-only schemas are imported in client code
7. **Payload bloat**: Search server code for `randomBytes`, intentional padding, or suspiciously large string generation
8. **Preload tags**: Check if HTML template has excessive preload/prefetch for all assets
9. **State management**: Search for `useStore((s) => s)` or equivalent "select everything" patterns
10. **Image formats**: Check what formats are used in public/ (png, jpg vs avif, webp)
11. **Source maps**: Check if inline source maps are configured
12. **CSS runtime**: Check if UnoCSS/Tailwind is running in runtime/JIT mode on client

Report each finding as:
```
FILE: path:line
ISSUE: description
IMPACT: HIGH/MEDIUM/LOW
FIX: one-line suggestion
```
