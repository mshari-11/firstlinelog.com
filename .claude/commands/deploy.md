# Deploy to Production

Automated deployment workflow for FirstLine Logistics platform.

## Steps

1. Run `npm run build` to build the production bundle
2. Verify the build succeeded (check for dist/ directory and dist/index.html)
3. Run `git status` to check for uncommitted changes
4. If there are uncommitted changes, create a commit with a descriptive message
5. Push to the current branch: `git push -u origin $(git branch --show-current)`
6. Report the deployment status:
   - Build size summary
   - Files changed
   - Branch pushed to
   - Vercel auto-deploy URL: https://firstlinelog.com

## Important Rules

- NEVER push to main without user confirmation
- NEVER modify files in the OTP/auth system (LOCKED)
- Always verify build succeeds before pushing
- If build fails, report errors and stop — do NOT push broken code
- The site auto-deploys on Vercel after push to main
- Always use `git push -u origin <branch-name>` format
- Retry push up to 4 times with exponential backoff on network failures
