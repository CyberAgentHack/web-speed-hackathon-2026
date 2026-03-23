Analyze bundle size bottlenecks. Be concise.

1. Read webpack config: mode, devtool, splitChunks, loaders, polyfills.
2. List client-side dependencies by estimated bundle size. Flag:
   - Libs >50KB that have lighter alternatives
   - Server-only libs leaking into client bundle
   - Full imports where tree-shaking could help
3. Grep client/ imports for barrel imports of heavy libs.
4. Check if dynamic import / code splitting is working.

Output: prioritized list of removals/swaps with estimated size savings.
