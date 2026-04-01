# Run Tests

Execute the full project test suite and report results.

## Steps

1. **TypeScript Type Check**: Run `npx tsc --noEmit` to verify type safety
   - Report any type errors with file:line references
   - Categorize errors by severity

2. **Build Verification**: Run `npm run build`
   - Verify dist/ directory is created
   - Report bundle sizes
   - Flag any chunks over 500KB

3. **Playwright E2E Tests** (if configured): Run `npx playwright test`
   - Report pass/fail for each test
   - Include screenshots for failures
   - Summarize test coverage

4. **Lint Check**: Run `npx eslint src/ --max-warnings=0` (if configured)
   - Report lint errors and warnings
   - Suggest auto-fixes where available

5. **Summary Report**:
   - Total pass/fail counts
   - Build status
   - Type safety status
   - Recommended fixes

## Important Rules

- If any step fails, continue with remaining steps
- Report ALL results at the end, not just failures
- Suggest specific fixes for any failures found
- Use Arabic for the summary report
