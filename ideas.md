This app has a Crok AI chat feature and is an SNS-type app. Check:
1. Is the AI/LLM-related code on the critical path or properly lazy-loaded?
2. Are there any infinite scroll endpoints fetching all records instead of paginated results?
3. Timeline, feed, or post endpoints — are they returning unnecessarily large payloads?
4. Any sequential API calls on page load that could be parallelized with Promise.all?
