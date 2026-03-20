Investigate this WSH project for performance issues. Be concise.

1. **Bundler config**: Find webpack config. Check mode, source-map, chunk splitting, suspicious settings.
2. **Dependencies**: Scan package.json. Flag oversized or duplicate libs (multiple video players, full icon sets, FFmpeg WASM, etc).
3. **Server**: Framework, DB/ORM, cache-control headers, heavy queries, intentional padding (randomBytes etc).
4. **Client**: Routing, state management, CSS approach, SSR status.
5. **Intentional traps**: grep for setTimeout/sleep/delay, randomBytes, `mode:`, `no-store`, `inline-source-map`, polyfill imports. List all findings.

Output a prioritized action list: what to fix first for maximum Lighthouse improvement with minimum risk.
