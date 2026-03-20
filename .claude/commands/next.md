Suggest the single highest-impact improvement I should do next.

1. Read `.claude/progress.md` if it exists (what's already done)
2. Quick-scan for remaining low-hanging fruit:
   - Any remaining `no-store` cache headers?
   - Any remaining artificial delays?
   - Images still in PNG/JPEG that could be AVIF?
   - Bundle still >500KB? What's the biggest chunk?
   - Any API response >1MB?
3. Suggest ONE concrete change with:
   - File to edit
   - What to change (show diff if possible)
   - Expected impact on which Lighthouse metric
   - Risk level for regulation violation

Keep it short — one action only, not a laundry list.
