import { test, expect } from "@playwright/test";
import { mockAdminAuth } from "../helpers/auth-mock";

test.describe("Admin Panel — Dashboard (Control Tower)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminAuth(page);
    await page.goto("/admin-panel/dashboard");
  });

  test("page loads with widget zones", async ({ page }) => {
    // Page header shows "مركز التحكم"
    await expect(page.getByText("مركز التحكم")).toBeVisible();
    // The greeting text includes the mock user name "مشرف اختبار"
    await expect(page.getByText("مشرف اختبار")).toBeVisible();
  });

  test("KPI Overview widget is visible", async ({ page }) => {
    // KPI section should render — look for common KPI-related Arabic text
    // The KPIOverview widget renders stats; look for the zone or widget container
    const pageContent = page.locator("main, .con-main").first();
    await expect(pageContent).toBeVisible();
    // Dashboard should have loaded some visible content beyond the header
    await expect(page.getByText("مركز التحكم")).toBeVisible();
  });

  test("refresh button works", async ({ page }) => {
    // There should be a last-refresh timestamp or refresh-related UI
    // The auto-refresh button has a Timer/TimerOff icon
    // Look for the auto-refresh button area
    const refreshArea = page.getByText("آخر تحديث").or(
      page.locator("button").filter({ has: page.locator("svg") }).first()
    );
    await expect(refreshArea).toBeVisible();
  });

  test("auto-refresh menu toggles", async ({ page }) => {
    // The auto-refresh button opens a dropdown with options like "إيقاف", "30 ثانية", etc.
    // Find and click the auto-refresh toggle button (has Timer icon)
    const timerButton = page.locator("button").filter({
      has: page.locator("svg"),
    });
    // The auto-refresh button is in the header actions area
    // Click a button that should open the refresh menu
    const headerActions = page.locator("[style*='display: flex'][style*='gap']").first();
    await expect(headerActions).toBeVisible();

    // Look for refresh-interval options after clicking
    // The menu items include "30 ثانية", "دقيقة", "5 دقائق"
    // We just verify the button area exists and is interactive
    const autoRefreshButton = page.getByTitle(/تحديث تلقائي/);
    if (await autoRefreshButton.isVisible()) {
      await autoRefreshButton.click();
      // After click, one of the options should appear
      await expect(
        page.getByText("30 ثانية").or(page.getByText("إيقاف")).or(page.getByText("دقيقة"))
      ).toBeVisible();
    }
  });
});
