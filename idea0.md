Add appropriate Cache-Control headers to the Express server:

1. Static assets (js, css, images, fonts, videos): max-age=31536000, immutable
2. HTML: no-cache (so new deploys are picked up)
3. API responses: no-store or short max-age depending on the endpoint

Current server is Express with tsx.
