Analyze backend API performance. Be concise.

1. List all route handlers (Express routes).
2. For each endpoint, check:
   - N+1 queries (loops with DB calls inside)
   - Missing LIMIT clauses
   - Unused fields in response (especially large text like description)
   - Intentional bloat (randomBytes, padding)
3. Check cache-control headers (global middleware and per-route).
4. Check DB schema for missing indexes on frequently queried columns.
5. Estimate response sizes for the heaviest endpoints.

Output: fixes ranked by (impact x ease). Include the file path and line numbers.
