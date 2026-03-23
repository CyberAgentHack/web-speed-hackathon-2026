Check regulation compliance.

1. Read and summarize `docs/regulation.md` (key rules only).
2. Read and summarize `docs/scoring.md` (how scoring works).
3. Find VRT/E2E test commands in package.json scripts and e2e/ directory.
4. If there are uncommitted changes (`git diff`), flag anything that might violate regulation:
   - Seed data / faker call order changes
   - Visual changes (removed elements, changed layout)
   - Removed functionality
5. Report test run commands the operator should execute before pushing.
