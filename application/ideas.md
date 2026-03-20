Analyze the app for remaining performance issues. Report findings before making any changes.

1. Bundle analysis
   - Run webpack-bundle-analyzer and list top 10 heaviest modules still in main.js
   - Are there any dependencies that could be removed or lazy-loaded?

2. Network / API
   - Find any endpoints returning unbounded or very large payloads (no pagination, all fields)
   - Find N+1 query patterns in server routes
   - Find any sequential API calls on page load that could be parallelized with Promise.all
   - Check if any API responses include large text fields (e.g. description, content) that aren't needed by the UI

3. Re-render analysis
   - Check Zustand store selectors — are any using (s) => s (subscribes to entire store)?
   - Find any setInterval/setTimeout causing periodic re-renders
   - Find any components re-rendering on every frame or mouse move

4. Critical path
   - Are there any render-blocking scripts or stylesheets in the HTML <head>?
   - Is SSR output actually hydrating correctly on the client?
   - Any waterfalled requests that could be preloaded or parallelized?

5. Known WSH patterns (check if present)
   - Intentional sleep/delay anywhere still remaining
   - Cache-Control headers — are static assets getting long-term caching?
   - Image URLs with cache-busting query params that prevent caching
   - Any components doing expensive computation on every render that could be memoized
