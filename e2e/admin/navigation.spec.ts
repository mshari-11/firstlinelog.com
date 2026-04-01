import { test, expect } from "@playwright/test";
import { mockAdminAuth } from "../helpers/auth-mock";

test.describe("Admin Panel — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminAuth(page);
  });

  test("loads /admin-panel/dashboard", async ({ page }) => {
    await page.goto("/admin-panel/dashboard");
    // The breadcrumb always shows "لوحة الإدارة"
    await expect(page.getByText("لوحة الإدارة")).toBeVisible();
  });

  test("loads /admin-panel/feedbacks", async ({ page }) => {
    await page.goto("/admin-panel/feedbacks");
    await expect(page.getByText("التقييمات والملاحظات")).toBeVisible();
  });

  test("loads /admin-panel/settings", async ({ page }) => {
    await page.goto("/admin-panel/settings");
    // Settings page has setting labels in Arabic
    await expect(page.getByText("اسم الشركة")).toBeVisible();
  });

  test("sidebar is visible with navigation items", async ({ page }) => {
    await page.goto("/admin-panel/dashboard");
    // The sidebar contains the admin root breadcrumb link "لوحة الإدارة"
    // and specific route names visible in the sidebar
    const sidebar = page.locator(".con-sidebar, [class*='sidebar'], nav, aside").first();
    await expect(sidebar).toBeVisible();
    // Check some Arabic navigation items that appear in the sidebar
    await expect(page.getByText("لوحة التحكم")).toBeVisible();
  });

  test("page titles render in Arabic", async ({ page }) => {
    await page.goto("/admin-panel/dashboard");
    // Dashboard page title is "مركز التحكم"
    await expect(page.getByText("مركز التحكم")).toBeVisible();

    await page.goto("/admin-panel/feedbacks");
    await expect(page.getByText("التقييمات والملاحظات")).toBeVisible();
  });

  test("RTL direction is set on admin layout", async ({ page }) => {
    await page.goto("/admin-panel/dashboard");
    const rtlContainer = page.locator("[dir='rtl']").first();
    await expect(rtlContainer).toBeVisible();
  });
});
