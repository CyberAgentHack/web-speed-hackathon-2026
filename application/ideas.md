After migrating to Vite, getting "Buffer is not defined" in the browser.
Webpack previously injected Buffer via ProvidePlugin.

Fix options:

1. Add to vite.config.ts:
   define: { global: 'globalThis' }
   and install + configure vite-plugin-node-polyfills

2. Or find what's using Buffer and replace with browser-native alternative

Check what's importing Buffer and fix accordingly.
