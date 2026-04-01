# Code Review

Perform a thorough code review of recently changed files in the admin panel.

## Steps

1. Run `git diff --name-only HEAD~3` to find recently changed files
2. Read each changed file that's under `src/pages/admin/` or `src/components/admin/`
3. Review for:
   - **Security**: XSS risks, injection, unsafe innerHTML, OWASP top 10
   - **Performance**: Unnecessary re-renders, missing useMemo/useCallback, large lists without virtualization
   - **TypeScript**: Proper types, missing generics, any usage
   - **Arabic RTL**: dir="rtl", text-align, flexbox direction
   - **Accessibility**: ARIA labels, keyboard navigation, focus management, screen reader
   - **Design System**: Consistency with Obsidian Command (--con-* CSS variables, inline styles)
   - **Error Handling**: try/catch, fallback data, loading states
4. Report findings with severity levels:
   - 🔴 Critical — must fix before deploy
   - 🟡 Warning — should fix soon
   - 🟢 Info — nice to have
5. Suggest specific fixes with code snippets

## Important Rules

- Focus ONLY on admin panel files (src/pages/admin/, src/components/admin/)
- Do NOT modify locked files (OTP, auth, cognito)
- Use Arabic for explanations, English for code
- Reference file:line_number for each finding
