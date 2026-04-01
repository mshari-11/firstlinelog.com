# CLAUDE.md — FLL Platform (firstlinelog.com)

## Project Overview
First Line Logistics (FLL) web platform — internal operations dashboard for managing delivery riders, orders, and performance tracking.

- **Repo:** mshari-11/firstlinelog.com
- **Deployed:** Vercel
- **Stack:** React + Vite + JavaScript

---

## Architecture

### Frontend
- **Framework:** React + Vite
- **Language:** JavaScript (JSX)
- **Styling:** (to be confirmed — likely Tailwind or CSS modules)
- **Routing:** React Router
- **Deployment:** Vercel (auto-deploy from main branch)

### Backend / Cloud (AWS)
- **Auth:** AWS Cognito (OTP-based, email via SES)
- **API:** API Gateway → Lambda functions
- **Logs:** CloudWatch
- **Region:** (confirm: me-south-1 or us-east-1?)

### Auth Flow
- User enters email → receives OTP via AWS SES → confirms OTP → Cognito issues tokens
- Known issues: SES in Sandbox mode, Suppression List blocks some emails, SPF/DKIM/DMARC DNS records need verification

---

## Naming Conventions (Claude-Suggested — confirm or override)

### Files & Folders
```
src/
├── components/        # Reusable UI pieces
│   └── Button.jsx     # PascalCase for components
├── pages/             # Route-level pages
│   └── Dashboard.jsx  # PascalCase for pages
├── hooks/             # Custom React hooks
│   └── useAuth.js     # camelCase with "use" prefix
├── services/          # API calls & external integrations
│   └── authService.js # camelCase with "Service" suffix
├── utils/             # Pure helper functions
│   └── formatDate.js  # camelCase
├── constants/         # Static values & config
│   └── apiConfig.js   # camelCase
└── context/           # React Context providers
    └── AuthContext.jsx # PascalCase with "Context" suffix
```

### Component Naming
| Type | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | `RiderCard.jsx` |
| Page file | PascalCase + "Page" suffix | `DashboardPage.jsx` |
| Hook file | camelCase + "use" prefix | `useRiderData.js` |
| Service file | camelCase + "Service" suffix | `riderService.js` |
| Utility file | camelCase | `formatOrders.js` |
| Constant file | camelCase | `riderConfig.js` |

### Variables & Functions
- Components: `PascalCase` → `RiderTable`
- Functions: `camelCase` → `fetchRiderOrders()`
- Constants: `UPPER_SNAKE_CASE` → `MAX_RIDERS_PER_PAGE`
- Boolean vars: `is/has/can` prefix → `isLoading`, `hasError`, `canEdit`

---

## Business Domain (FLL-Specific)

### Rider Categories
- **كفالة (Kefala):** Sponsored riders — tracked via Ninja Captain CSVs
- **حر (Freelance):** Freelance riders — tracked via 3PL Hunger Station CSV

### Key Metrics
- Orders per rider (daily/weekly)
- Attendance rate
- Performance vs target

### Data Sources
- Ninja Captain: cumulative data → use MAX across files
- 3PL Hunger Station: cumulative data → use subtraction logic for daily increments
- Kita Excel: attendance & base data

---

## Known Issues & Context
- Cognito OTP emails sometimes blocked → check SES Suppression List first
- API Gateway has had breaking changes → always verify endpoint URLs in AWS Console
- Sidebar CSS layout issue → (describe fix here once resolved)
- Vercel deployment: environment variables must be set in Vercel dashboard, not just .env

---

## Claude Behavior Guidelines

### Always
- Use JavaScript (JSX), not TypeScript
- Follow the naming conventions defined above
- Keep components small and single-responsibility
- Check if a utility function already exists in `/utils` before creating a new one
- When touching AWS/Cognito code, note any SES or auth edge cases

### Never
- Don't add TypeScript or convert JS files to TS
- Don't change the Vite config without explaining why
- Don't use `var` — use `const` and `let` only
- Don't create files outside the `src/` structure without asking

### When Debugging AWS Issues
1. Check CloudWatch logs first
2. Verify environment variables in Vercel dashboard
3. Confirm API Gateway endpoint is deployed (not just saved)
4. Check Cognito User Pool settings before touching code

---

## Environment Variables (Vercel + Local)
```
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_API_GATEWAY_URL=
VITE_AWS_REGION=
```
> ⚠️ Never commit actual values. Always use Vercel dashboard for production secrets.

---

## Quick Commands
```bash
npm run dev          # Local development
npm run build        # Production build
npm run preview      # Preview production build locally
```

---

*Last updated: April 2026 — update this file whenever architecture changes*
