Check the server's HTML response handler:
1. Run: curl http://localhost:3000 | head -50
2. Check if <body> is empty or has content
3. If <body> is empty, renderToString() result is not being used in the response
4. Fix SSR so the rendered HTML is actually sent in the response body
5. This is likely the main reason FCP/LCP scores are 0
