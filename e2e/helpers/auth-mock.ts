import { Page } from "@playwright/test";

/**
 * Mock auth state by injecting localStorage keys before page load.
 *
 * The app reads two keys on boot:
 *   - fll_session  — { token, expires_at }
 *   - fll_user     — { id, email, name, role }
 *
 * When both exist and the session is not expired, AdminLayout renders
 * the authenticated admin shell instead of redirecting to /admin/login.
 */
export async function mockAdminAuth(page: Page) {
  const mockUser = {
    id: "test-admin",
    email: "admin@fll.sa",
    name: "مشرف اختبار",
    full_name: "مشرف اختبار",
    role: "admin",
  };

  // Expire far in the future so tests never hit the logout branch.
  const mockSession = {
    token: "mock-jwt-token-for-e2e-tests",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  await page.addInitScript(
    ({ user, session }) => {
      localStorage.setItem("fll_session", JSON.stringify(session));
      localStorage.setItem("fll_user", JSON.stringify(user));
    },
    { user: mockUser, session: mockSession },
  );
}
